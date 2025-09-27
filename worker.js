import { Summary, compareTeams, Team, computeMatch, simulateMatchELOHFA, simulateMatchAgnostic, simulateMatchAgnosticHFA, simulateMatchELOHFAOld } from './base.js';

function runSimulation(upcomingMatches, realCampaign, N_SIMS, method, n_teams, n_rounds) {
	let tabelaProbs = [];
	let stats = new Map();

	for (let t of Object.values(realCampaign)) {
		//stats.set(t.name, { nome: t.name, histograma: new Array(n_teams).fill(0), hihstPontos: new Array(n_rounds * 3 + 1).fill(0) });
		stats.set(t.name, new Summary(t.name, n_teams, n_rounds));

	}

	for (let i = 0; i < N_SIMS; i++) {
		if (i % (N_SIMS / 20) == 0) {
			postMessage(['progress', 100 * i / N_SIMS]);
		}
		let dicTimes = new Map;
		realCampaign.forEach((team, name) => {
			dicTimes.set(name, { ...team });
		});

		for (let j of upcomingMatches) {
			if (!dicTimes.has(j.homeTeam)) {
				dicTimes.set(j.homeTeam, new Team(j.homeTeam, j.homeBadge));
			}
			if (!stats.has(j.homeTeam)) {
				stats.set(j.homeTeam, new Summary(j.homeTeam, n_teams, n_rounds));
			}
			if (!dicTimes.has(j.awayTeam)) {
				dicTimes.set(j.awayTeam, new Team(j.awayTeam, j.awayBadge));
			}
			if (!stats.has(j.awayTeam)) {
				stats.set(j.awayTeam, new Summary(j.awayTeam, n_teams, n_rounds));
			}
			let [homeScore, awayScore] = method(dicTimes.get(j.homeTeam), dicTimes.get(j.awayTeam));
			computeMatch(dicTimes.get(j.homeTeam), dicTimes.get(j.awayTeam), homeScore, awayScore);
		}

		let classif = [];
		dicTimes.forEach((team, _name) => {
			let teamInDic = { ...team };
			classif.push(teamInDic);
		});
		classif.sort((a, b) => compareTeams(a, b));


		for (let pos = 0; pos < classif.length; pos++) {
			let teamName = classif[pos].name;
			let teamStats = stats.get(teamName);
			teamStats.histograma[pos] += 1;
			let teamPoints = dicTimes.get(teamName).points;
			teamStats.histPontos[teamPoints] += 1;
		}
	}
	tabelaProbs = [];
	for (let e of stats.values()) {
		tabelaProbs.push(e);
	}
	tabelaProbs.sort((a, b) => a.compareTo(b));
	return tabelaProbs;
}

onmessage = e => {
	if (e.data[0] == 'run') {
		let upcomingMatches = e.data[1];
		let realCampaign = e.data[2];
		let n_sims = e.data[3];
		let method_name = e.data[4];
		let n_teams = e.data[5];
		let n_rounds = e.data[6];
		let method = ({
			"ELOHFA": simulateMatchELOHFA,
			"Agnostic": simulateMatchAgnostic,
			"AgnosticHFA": simulateMatchAgnosticHFA,
			"ELOHFAOld": simulateMatchELOHFAOld,
		})[method_name];
		method = method ? method : simulateMatchELOHFA;
		let tabelaProbs = runSimulation(upcomingMatches, realCampaign, n_sims, method, n_teams, n_rounds);
		postMessage(["done", tabelaProbs]);
	}
}
