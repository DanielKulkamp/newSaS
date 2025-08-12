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
