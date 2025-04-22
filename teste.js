function simplerMatch(match) {
	const newMatch = {
		id: match.id,
		homeTeam: match.homeTeam.name,
		homeTeamCountry: match.homeTeam.country.name,
		awayTeam: match.awayTeam.name,
		awayTeamCountry: match.awayTeam.country.name,
		homeScore: match.homeScore.current,
		awayScore: match.awayScore.current,
		startTimestamp: match.startTimestamp,
		season: match.seasonName,
		status: match.status.code,
		homeTeamId: 0,
		awayTeamId: 0,
		tournamentId: 0,
		seasonId: 0,
		homeTeamRating: undefined,
		awayTeamRating: undefined,
		homeTeamRatingAfter: undefined,
		awayTeamRatingAfter: undefined,
	}
	try { newMatch.homeTeamId = match.homeTeam.id } catch (error) { console.log(error, match); }
	try { newMatch.awayTeamId = match.awayTeam.id } catch (error) { console.log(error, match); }
	try { newMatch.tournamentId = match.tournament.uniqueTournament.id } catch (error) { console.log(error, match); }
	try { newMatch.seasonId = match.season.id } catch (error) { console.log(error, match); }
	return newMatch;
}


async function getMatches(date) {

	const url = `https://api.sofascore.com/api/v1/sport/football/scheduled-events/${date.toISOString().split('T')[0]}`; // Data de hoje no formato YYYY-MM-DD

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error('Network response was not ok');
	}
	const data = await response.json();
	return data.events.filter(event => {
		let masc = event.homeTeam.gender === 'M';
		let conmebol = [
			'Argentina',
			'Brazil',
			'Bolivia',
			'Chile',
			'Colombia',
			'Ecuador',
			'Paraguai',
			'Peru',
			'Uruguai',
			'Venezuela'
		].includes(event.tournament?.category?.country?.name);

		let bras = event.tournament.category.country.name === 'Brazil';
		let tname = 'no unique name';
		try {
			tname = event.tournament.uniqueTournament.name
		} catch (error) {
			console.log(error);
			console.log(event);
		}
		let sula = [
			"CONMEBOL Libertadores",
			"CONMEBOL Sudamericana",
			"CONMEBOL Recopa"]
			.includes(tname);
		return masc && (conmebol || sula);
	}).map(simplerMatch);
}

function eloDeltaRating(homeRating, awayRating, homeScore, awayScore, importance) {
	let result = 0.5;
	if (homeScore > awayScore) {
		result = 1;
	} else if (homeScore == awayScore) {
	} else {
		result = 0;
	}

	const goalDiff = Math.abs(homeScore - awayScore);
	let factor = 1;
	if (goalDiff == 2) factor = 1.5;
	if (goalDiff == 3) factor = 1.75;
	if (goalDiff > 3) factor = (1.75 + ((goalDiff - 3.0) / 8.0));

	const deltaRating = homeRating - awayRating + 40.0;
	const winExpectancy = (1 / (1 + Math.pow(10, -(deltaRating) / 400.0)));
	const adjust = importance * factor * (result - winExpectancy);
	return adjust;
}

function getImportance(tournamentId) {
	if (tournamentId == 325) return 60; //serie A
	if (tournamentId == 384) return 60; //libertadores
	if (tournamentId == 480) return 55; //sulamericana
	if (tournamentId == 490) return 50; // recopa
	if (tournamentId == 373) return 55; // copa do brasili
	if (tournamentId == 14602) return 50; // supercopa do brasil
	if (tournamentId == 390) return 50; //serie B
	if (tournamentId == 1281) return 40; //serie C
	if (tournamentId == 10326) return 30; // serie D
	if (tournamentId == 1596) return 40; //copa do nordeste
	if (tournamentId == 10158) return 30; //copa verde
	const estaduais = [
		14659,
		10294,
		13668,
		11702,
		374,
		11682,
		14650,
		92,
		376,
		378,
		377,
		381,
		11664,
		11670,
		379,
		11669,
		10295,
		382,
		372,
		380,
		13353,
		11663,
		14658,
		14733,
		11665,
		11679,
		14686
	];
	if (estaduais.includes(tournamentId)) return 10;
	return 60;
}

async function main() {
	const fs = require('fs');
	let ratings = new Map();
	let names = new Map();
	let countries = new Map();
	const currDate = new Date('2008-01-01');
	let allMatches = [];
	const endDate = new Date();
	while (currDate <= endDate) {
		let matches = await getMatches(currDate);
		let ids = allMatches.map(x => x.id);
		matches = matches.filter(x => !ids.includes(x.id));
		allMatches = allMatches.concat(matches);
		currDate.setDate(currDate.getDate() + 1);
		console.log(currDate.toISOString());
	}
	for (match of allMatches) {
		const homeRating = ratings.get(match.homeTeamId) || 1000.0;
		const awayRating = ratings.get(match.awayTeamId) || 1000.0;
		const homeScore = match.homeScore;
		const awayScore = match.awayScore;
		const importance = getImportance(match.tournamentId);
		match.homeTeamRating = homeRating;
		match.awayTeamRating = awayRating;
		delta = eloDeltaRating(homeRating, awayRating, homeScore, awayScore, importance);
		match.homeTeamRatingAfter = homeRating + delta;
		match.awayTeamRatingAfter = awayRating - delta;
		names.set(match.homeTeamId, match.homeTeam);
		countries.set(match.homeTeamId, match.homeTeamCountry);
		countries.set(match.awayTeamId, match.awayTeamCountry);
		ratings.set(match.homeTeamId, homeRating + delta);
		names.set(match.awayTeamId, match.awayTeam);
		ratings.set(match.awayTeamId, awayRating - delta);
		console.log(`${match.homeTeam}[${homeRating}] ${match.homeScore} x ${match.awayScore} [${awayRating}]${match.awayTeam}`);

	}
	fs.writeFile('matches.txt', JSON.stringify(allMatches), err => {
		if (err) {
			console.error('Error writing to file:', err);
		} else {
		}
	});

	let ranking = Array.from(ratings)
		.map(([id, rating]) => [names.get(id), rating, id])
		.sort((a, b) => b[1] - a[1]);
	for ([teamName, teamRating, id] of ranking) {
		let filename = countries.get(id) === 'Brazil' ? 'ratings.txt' : 'gringos.txt';

		fs.appendFile(filename,
			`${teamName}(${id}): ${teamRating}\n`,
			err => {
				if (err) {
					console.error('Error writing to file:', err);
				} else {
				}
			});
	}
	//console.log(JSON.stringify(ranking));


}

main();

