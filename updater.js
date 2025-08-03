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

function event_to_older_format(event) {
  return {
    "id": event.id,
    "tournament": event.season_name,
    "number": event.id,
    "homeTeam": event.home_team_name,
    "awayTeam": event.away_team_name,
    "homeScore": event?.home_score?.toString() ?? '',
    "awayScore": event?.away_score?.toString() ?? '',
    "date": new Date(event.timestamp * 1000).toLocaleString(),
    "done": event.status_code == 100 ? 1 : 0,
    "round": event.round,
    "timestamp": event.timestamp,
  };
}






export async function getListOfMatches(tournament, season, rounds) {
  const all_events = await fetch_rounds(tournament, season, rounds);//(325, 72034, 38)//serie a 2025
  const events = { events: simplify_events(all_events) }
  let unique_events = new Map()
  events.events.forEach(e => {
    //filter double entries
    let key = e.home_team_name + ' x ' + e.away_team_name;
    if (unique_events.get(key)?.status_code == undefined || unique_events.get(key)?.status_code == 60) {
      unique_events.set(key, e);
    }
  });
  return unique_events.values().toArray().map(x => event_to_older_format(x));

}
