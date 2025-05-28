/**
  * fetches rounds 1 to n_rounds from sofascore api.
  * @param {number} tournament - unique tournament id.
  * @param {number} season - season id.
  * @param {number} n_rounds - number of rounds to fecth.
  * @returns {object[][]} 
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
        return x.filter(e => e.status.code !== 60)
      }
    })
  return events

}

function simplify_events(events) {
  return events.reduce((acc, curr) => acc.concat(curr))
    .map(x => {
      return {
        'id': x.id,
        'tournament_id': x.tournament.uniqueTournament.id,
        'season_id': x.season.id,
        'round': x.roundInfo?.round,
        'status_code': x.status.code,
        'home_team_id': x.homeTeam.id,
        'home_team_name': x.homeTeam.name,
        'home_score': x.homeScore.current,
        'away_team_id': x.awayTeam.id,
        'away_team_name': x.awayTeam.name,
        'away_score': x.awayScore.current,
        'timestamp': x.startTimestamp
      }
    })
}

//const all_events = await fetch_rounds(325, 72034, 38)//serie a 2025
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
  return await fetch (`https://api.sofascore.com/api/v1/event/${event_id}`).then(r => r.json()).then(r => r.event.venue)

}

async function all_matches_team(team_id) {
  let current_page = 0;
  let events = [];
  while(true) {
    let page = await fetch_events_page(team_id, current_page);
    events = events.concat(page.events)
    current_page++;
    if(!page.hasNextPage) break;
  }
  return events;
    
}

let all_vasco_matches = await all_matches_team(1974)
let simple = simplify_events([all_vasco_matches])
let venues = await Promise.all( simple.map(x=> get_venue(x.id)))
let full = simple.map((x, id) => {return {venue: venues[id], ...x}})

console.log(full)

