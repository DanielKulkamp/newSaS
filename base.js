export const DIVISOR_ELO = 400.0;
export const IMPORTANCE = 30.0;
export const N_SIMS = 5_000;
export const HFA = 100;
export const PCT_VITORIA_SALDO_5 = 0.01;
export const PCT_VITORIA_SALDO_4 = 0.06;
export const PCT_VITORIA_SALDO_3 = 0.17;
export const PCT_VITORIA_SALDO_2 = 0.45;
export const PCT_EMPATE_0 = 0.35;
export const PCT_EMPATE_1 = 0.89;
export const PCT_EMPATE_2 = 0.99;
export const PCT_DERROTA_1 = 0.80;
export const PCT_DERROTA_2 = 0.99;
export const N_RUNS = 40;
export const RUNS = [];

export class Summary {
	constructor(nome, n_teams, n_rounds) {
		this.nome = nome;
		let n = 1 * (n_teams ?? 20);
		let r = n_rounds ?? 38;
		this.histograma = new Array(n).fill(0);
		this.histPontos = new Array(r * 3 + 1).fill(0);
	}
	compareTo(other) {
		return this.histograma.map((val, index) => (other.histograma[index] * 1.0 - (val * 1.0))).reduce((acc, curr) => acc != 0 ? acc : curr);
		//if (this.histograma > other.histograma) return -1;
		//if (this.histograma < other.histograma) return 1;
		//return 0;
	}
}

/**
 * Calculates and returns homewin/draw expectancy, given two Teams
 * @param casa : home Team
 * @param fora : away Team
 * @returns [ float, float, float]
 */
export function expectancy(casa, fora) {
	const deltaRating = casa.rating + HFA - fora.rating;
	const divisor = 1 + Math.pow(10, -deltaRating / DIVISOR_ELO) + Math.pow(10, deltaRating / DIVISOR_ELO);
	let win = Math.pow(10, deltaRating / DIVISOR_ELO) / divisor;
	let draw = 1 / divisor;
	let loss = 1 - win - draw;
	return [win, draw, loss]
}

export function compareTeams(one, other) {
	if (one.points > other.points) return -1;
	if (one.points < other.points) return 1;
	if (one.wins > other.wins) return -1;
	if (one.wins < other.wins) return 1;
	if (one.goalDiff > other.goalDiff) return -1;
	if (one.goalDiff < other.goalDiff) return 1;
	if (one.goalsFor > other.goalsFor) return -1;
	if (one.goalsFor < other.goalsFor) return 1;
	return 0;
}


export class Team {
	static INITIAL_RATING = 1000.0;
	points = 0;
	wins = 0;
	rating = Team.INITIAL_RATING;
	goalsFor = 0;
	goalsAgainst = 0;
	goalDiff = 0;
	matches = 0;
	name = "";
	goalsForHome = 0;
	goalsForAway = 0;
	goalsAgainstHome = 0;
	goalsAgainsAway = 0;
	winsHome = 0;
	winsAway = 0.

	constructor(name) {
		this.name = name;
		this.wins = 0;
		this.points = 0;
		this.rating = Team.INITIAL_RATING;
		this.goalsAgainst = 0;
		this.goalsFor = 0;
		this.goalDiff = 0;
		this.matches = 0;
		this.goalsForHome = 0;
		this.goalsForAway = 0;
		this.goalsAgainstHome = 0;
		this.goalsAgainsAway = 0;
		this.winsHome = 0;
		this.winsAway = 0.
	}

	compareTo(other) {
		return compareTeams(this, other);
	}
}


/**
 *  Updates homeTeam and awayTeam ratings and campaign given respective scores
 *  @param homeTeam a Team
 *  @param awayTeam a Team
 *  @param homeScore integer
 *  @param awayScore integer
 */
export function computeMatch(homeTeam, awayTeam, homeScore, awayScore) {
	let homePoints = 0;
	let awayPoints = 0;
	let homeWins = 0;
	let awayWins = 0;
	let result = 0.5;

	if (homeScore > awayScore) {
		homePoints = 3;
		homeWins = 1;
		result = 1;
	} else if (homeScore == awayScore) {
		homePoints = 1;
		awayPoints = 1;
	} else {
		awayPoints = 3;
		awayWins = 1;
		result = 0;
	}

	const goalDiff = Math.abs(homeScore - awayScore);
	let factor = 1;
	if (goalDiff == 2) factor = 1.5;
	if (goalDiff == 3) factor = 1.75;
	if (goalDiff > 3) factor = (1.75 + ((goalDiff - 3.0) / 8.0));
	homeTeam.matches += 1;
	homeTeam.goalsFor += homeScore;
	homeTeam.goalsForHome += homeScore;
	homeTeam.goalsAgainst += awayScore;
	homeTeam.goalsAgainstHome += awayScore;
	homeTeam.goalDiff = homeTeam.goalsFor - homeTeam.goalsAgainst;
	homeTeam.points += homePoints;
	homeTeam.wins += homeWins;
	homeTeam.winsHome += homeWins;

	awayTeam.matches += 1;
	awayTeam.goalsFor += awayScore;
	awayTeam.goalsForAway += awayScore;
	awayTeam.goalsAgainst += homeScore;
	awayTeam.goalsAgainstAway += homeScore;
	awayTeam.goalDiff = awayTeam.goalsFor - awayTeam.goalsAgainst;
	awayTeam.points += awayPoints;
	awayTeam.wins += awayWins;
	awayTeam.winsAway += awayWins;

	const deltaRating = homeTeam.rating - awayTeam.rating + HFA;
	const winExpectancy = (1 / (1 + Math.pow(10, -(deltaRating) / DIVISOR_ELO)));
	const adjust = IMPORTANCE * factor * (result - winExpectancy);
	homeTeam.rating += adjust;
	awayTeam.rating -= adjust;

}

/**
 * generates a random number following a poisson distribution
 * @param lambda - the mean of the distribution
 * @returns a random positive integer 
 */
export function poisson(lambda) {
	let L = Math.exp(-lambda);
	let k = 0;
	let p = 1;

	do {
		k++;
		p *= Math.random();
	} while (p > L);

	return k - 1;
}

export function simulateMatchAgnostic() {
	return [poisson(1.25), poisson(1.25)];
}

export function simulateMatchAgnosticHFA() {
	return [poisson(1.38), poisson(1.05)];
}


/**
 * Simulates a Match using ELO ratings
 * @param casa - an Object of class Team
 * @param fora - an Onject of class Team
 * @returns [homeScore, awayScore];
 */
export function simulateMatchELOHFA(casa, fora) {
	let [winExpectancy, drawExpectancy] = expectancy(casa, fora);
	let result = Math.random();
	if (result > winExpectancy + drawExpectancy) { //away win
		let loser = poisson(0.4);
		let winner = loser + poisson(0.4) + 1;
		return [loser, winner];
	}
	if (result > winExpectancy) { //draw
		let score = poisson(0.37);
		return [score, score];
	}
	let loser = poisson(0.5);
	return [loser + 1 + poisson(0.5), loser];
}

/**
 * Simulates a Match using ELO ratings
 * @param casa - an Object of class Team
 * @param fora - an Onject of class Team
 * @returns [homeScore, awayScore];
 */
export function simulateMatchELOHFAOld(casa, fora) {
	let [winExpectancy, drawExpectancy] = expectancy(casa, fora);
	const alea = Math.random();
	const alea2 = Math.random();
	let homeScore = 0;
	let awayScore = 0;

	if (alea < winExpectancy * PCT_VITORIA_SALDO_5) {
		homeScore = 5;
		awayScore = 0;
	} else if (alea < winExpectancy * PCT_VITORIA_SALDO_4) {
		if (alea2 < 0.9) {
			homeScore = 4;
			awayScore = 0;
		} else {
			homeScore = 5;
			awayScore = 1;
		}
	} else if (alea < winExpectancy * PCT_VITORIA_SALDO_3) {
		homeScore = 3;
		awayScore = 1;
		if ((alea2 > 0.7) && (alea2 < 0.95)) {
			homeScore = 4;
			awayScore = 1;
		}
		if (alea2 > 0.95) {
			homeScore = 5
			awayScore = 2
		}
	} else if (alea < winExpectancy * PCT_VITORIA_SALDO_2) {
		homeScore = 2;
		awayScore = 0;
		if ((alea2 > 0.70) && (alea2 < 0.95)) {
			homeScore = 3;
			awayScore = 1;
		}
		if (alea2 > 0.95) {
			homeScore = 4;
			awayScore = 2;
		}

	} else if (alea < winExpectancy) {
		homeScore = 1;
		awayScore = 0;
		if ((alea2 > 0.60) && (alea2 < 0.95)) {
			homeScore = 2;
			awayScore = 1;
		}
		if (alea2 > 0.95) {
			homeScore = 3;
			awayScore = 2;
		}
		if (alea2 > 0.99) {
			homeScore = 4;
			awayScore = 3;
		}

	} else if (alea - winExpectancy < drawExpectancy) {
		homeScore = 0;
		awayScore = 0;
		if ((alea2 > 0.60) && (alea2 < 0.95)) {
			homeScore = 1;
			awayScore = 1;
		}
		if (alea2 > 0.95) {
			homeScore = 2;
			awayScore = 2;
		}
	} else {
		if (Math.random() < PCT_DERROTA_1) {
			homeScore = 0;
			awayScore = 1;
			if ((alea2 > 0.60) && (alea2 < 0.95)) {
				homeScore = 1;
				awayScore = 2;
			}
			if (alea2 > 0.95) {
				homeScore = 2;
				awayScore = 3;
			}
		} else {
			homeScore = 0;
			awayScore = 2;
			if ((alea2 > 0.60) && (alea2 < 0.95)) {
				homeScore = 1;
				awayScore = 3;
			}
			if (alea2 > 0.95) {
				homeScore = 2;
				awayScore = 4;
			}
		}
	}
	return [homeScore, awayScore];
}


/**
 * Computes ratings and campaigns from a list of matches.
 * @param {[Object]} alistOfMatches : an array of matches 
 * @returns [ranking, realCampaign] : um array com um array de times ordenado por rating e um dicionário dos nomesDostimes -> campanhas
 */
export function computePastMatches(alistOfMatches) {
	const pastMatches = alistOfMatches.filter(match => match.done);

	let realCampaign = new Map();
	for (let aMatch of pastMatches) {
		if (!realCampaign.has(aMatch.homeTeam)) {
			realCampaign.set(aMatch.homeTeam, new Team(aMatch.homeTeam));
		}
		if (!realCampaign.has(aMatch.awayTeam)) {
			realCampaign.set(aMatch.awayTeam, new Team(aMatch.awayTeam));
		}
		let tCasa = realCampaign.get(aMatch.homeTeam);
		let tFora = realCampaign.get(aMatch.awayTeam);
		computeMatch(tCasa, tFora, parseInt(aMatch.homeScore), parseInt(aMatch.awayScore));
	}

	const ranking = [];
	for (let [name, team] of realCampaign) {
		ranking.push(team);
	}
	ranking.sort((a, b) => b.rating - a.rating);
	return [ranking, realCampaign];
}


