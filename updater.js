/**
  * fetches rounds 1 to n_rounds from sofascore api.
  * @param {number} tournament - unique tournament id.
  * @param {number} season - season id.
  * @param {number} n_rounds - number of rounds to fecth.
  * @returns {Promise(object[][])} 
*/
async function fetch_rounds(tournament, season, n_rounds) {
  let rounds = Array.from({ length: n_rounds }, (_, i) => i + 1)
    .map(x => `https://api.sofascore.com/api/v1/unique-tournament/${tournament}/season/${season}/events/round/${x}`)
  let proms = rounds.map(url => fetch(url).then(response => response.json()))
  let values = await Promise.all(proms)
  const events = values.map(x => x.events)
    .map(x => {
      if (new Set(x.map(e => e.homeTeam.id)).length === x.length) {
        return x
      } else {
        console.log(x)
        return x//.filter(e => e.status.code !== 60)
      }
    })
  return events
}


/**
  * receives an array of array of events, return a single array of events with less fields
  * @param {object[][]} events - an array of array of event objects
  * @returns {object[]} array of simplified events 
  */
function simplify_events(events) {
  return events.reduce((acc, curr) => acc.concat(curr))
    .map(x => {
      return {
        'id': x.id,
        'tournament_id': x.tournament?.uniqueTournament?.id,
        'tournament_name': x.tournament?.uniqueTournament?.name,
        'season_id': x.season?.id,
        'season_name': x.season?.name,
        'round': x.roundInfo?.round,
        'status_code': x.status.code,
        'home_team_id': x.homeTeam.id,
        'home_team_name': x.homeTeam.name,
        'home_score': x.homeScore?.current,
        'away_team_id': x.awayTeam.id,
        'away_team_name': x.awayTeam.name,
        'away_score': x.awayScore?.current,
        'timestamp': x.startTimestamp
      }
    })
}

const all_events = await fetch_rounds(325, 72034, 38)//serie a 2025
console.log(JSON.stringify(all_events))
const events = { events: simplify_events(all_events) }
console.log(JSON.stringify(events.events))
events.events.forEach(e => {
  console.log(e)
  //console.log(`${e.timestamp} - ${e.home_team_name} ${e.home_score} x ${e.away_score} ${e.away_team_name}`);
  //fetch(`http://localhost/saver.php?event=${JSON.stringify(e)}`,
  //  {
  //    method: 'GET',
  //    //headers: { 'Content-Type': 'application/json' },
  //    //body: JSON.stringify(events)
  //  })
  //  .then(response => response.json())
  //  .then(data => console.log('Saved in the db', data))
  //  .catch(error => console.log('error', error))
});
console.log(events.events.length);
//const first_round = all_events[0]
//const all_teams = new Map(first_round.map(x => { return [[x.home_team_id, x.home_team_name], [x.away_team_id, x.away_team_name]] }).reduce((acc, cur) => acc.concat(cur)))
//console.log(all_teams)

//fetch_rounds(325, 58766, 38)
//fetch_rounds(17,61627,38)

async function fetch_events_page(team_id, page_number) {
  const url = `https://api.sofascore.com/api/v1/team/${team_id}/events/last/${page_number}`;
  return await fetch(url).then(response => response.json())
}

async function get_venue(event_id) {
  return await fetch(`https://api.sofascore.com/api/v1/event/${event_id}`).then(r => r.json()).then(r => r.event.venue)

}

async function all_matches_team(team_id) {
  let current_page = 0;
  let events = [];
  while (true) {
    let page = await fetch_events_page(team_id, current_page);
    events = events.concat(page.events)
    current_page++;
    if (!page.hasNextPage) break;
  }
  return events;
}
//let venues = await Promise.all( simple.map(x=> get_venue(x.id)))
//let full = simple.map((x, id) => {return {venue: venues[id], ...x}})

//function megaranking() { 
//let teams_to_fetch = new Set();
//let fetched_event_ids = new Set();
//let fetched_teams = new Set()
//let fetched_events = []
//teams_to_fetch.add(1974)
//while (teams_to_fetch.size > 0) {
//  let team_id = teams_to_fetch.values().next().value;
//  console.log(`Fetching ${team_id}\n`)
//  let team_matches = await all_matches_team(team_id)
//  let simple = simplify_events([team_matches])
//  let new_events = simple.filter(x => !fetched_event_ids.has(x.id))
//  new_events.forEach(x => { fetched_events.push(x); fetched_event_ids.add(x.id) })
//  fetch('http://localhost/saver.php', {
//    method: "PUT",
//    headers: {
//      "Content-Type": "application/json"
//    },
//    body: JSON.stringify({ events: new_events })
//  })
//    .then(response => response.json())
//    .then(result => console.log("Success:", result))
//    .catch(error => console.error("Error:", error));
//
//  fetched_teams.add(team_id)
//  let new_teams = simple.map(x => x.home_team_id)
//    .concat(simple.map(x => x.away_team_id))
//    .filter(x => !fetched_teams.has(x))
//  new_teams.forEach(x => teams_to_fetch.add(x))
//  teams_to_fetch.delete(team_id)
//  if (new_events.length > 0) {
//    document.write(`${new_events[0].home_team_id == team_id ? new_events[0].home_team_name : new_events[0].away_team_name}<br>`)
//  }
//}
//fetched_events.sort((x, y) => x.timestamp - y.timestamp);
//let tournament_names = new Set(fetched_events.map(x => x.tournament_name))
//let tournament_importance = new Map()
//tournament_names.forEach(x => {
//  let importance = prompt(x)
//  tournament_importance.set(x, 1.0 * importance)
//})
//document.write(JSON.stringify(Array.from(tournament_importance)))
//let ratings = new Map()
//fetched_events.forEach(e => {
//  e.home_rating_prev = ratings.get(e.home_team_id)?? 1000;
//  e.away_rating_prev = ratings.get(e.away_team_id)?? 1000;
//})
//}
