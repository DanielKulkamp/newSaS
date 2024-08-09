const DIVISOR_ELO = 400.0;
const IMPORTANCE = 30.0;
const HFA = 40;
const PCT_VITORIA_SALDO_5 = 0.01;
const PCT_VITORIA_SALDO_4 = 0.06;
const PCT_VITORIA_SALDO_3 = 0.17;
const PCT_VITORIA_SALDO_2 = 0.45;
const PCT_EMPATE_0 = 0.35;
const PCT_EMPATE_1 = 0.89;
const PCT_EMPATE_2 = 0.99;
const PCT_DERROTA_1 = 0.80;
const PCT_DERROTA_2 = 0.99;
const N_RUNS = 20;
var chart;

class Summary {
  constructor(nome) {
    this.nome = nome;
    this.titulos = 0;
    this.g4s = 0;
    this.z4s = 0;
    this.histograma = new Array(20).fill(0);
    this.histPontos = new Array(38*3+1).fill(0);
  }
  compareTo(other) {
    if (this.titulos > other.titulos) return -1;
    if (this.titulos < other.titulos) return 1;
    if (this.g4s > other.g4s) return -1;
    if (this.g4s < other.g4s) return 1;
    if (this.z4s > other.z4s) return 1;
    if (this.z4s < other.z4s) return -1;
    return 0;
  }
}

function expectancy(casa, fora) {
  const deltaRating = casa.rating + HFA - fora.rating;
  const divisor = 1 + Math.pow(10, -deltaRating / DIVISOR_ELO) + Math.pow(10, deltaRating / DIVISOR_ELO);
  let win = Math.pow(10, deltaRating / DIVISOR_ELO) / divisor;
  let draw = 1 / divisor;
  let loss = 1 - win - draw;
  return [win, draw, loss]
}

class Expectancy {
  constructor(casa, fora) {
    const deltaRating = casa.rating + HFA - fora.rating;
    const divisor = 1 + Math.pow(10, -deltaRating / DIVISOR_ELO) + Math.pow(10, deltaRating / DIVISOR_ELO);
    this.win = Math.pow(10, deltaRating / DIVISOR_ELO) / divisor;
    this.draw = 1 / divisor;
    this.loss = 1 - this.win - this.draw;
  }
}

function compareTeams(one, other){
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


class Team {
  static INITIAL_RATING = 1000.0;
  points = 0;
  wins = 0;
  rating = Team.INITIAL_RATING;
  goalsFor = 0;
  goalsAgainst = 0;
  goalDiff = 0;
  name = "";
    
  constructor(name) {
    this.name = name;
    this.wins = 0;
    this.points = 0;
    this.rating = Team.INITIAL_RATING;
    this.goalsAgainst = 0;
    this.goalsFor = 0;
    this.goalDiff = 0;
  } 
  
  compareTo(other) {
    return compareTeams(this, other);
  }
}

function computeMatch(homeTeam, awayTeam, homeScore, awayScore) {
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

  homeTeam.goalsFor += homeScore;
  homeTeam.goalsAgainst += awayScore;
  homeTeam.goalDiff = homeTeam.goalsFor - homeTeam.goalsAgainst;
  homeTeam.points += homePoints;
  homeTeam.wins += homeWins;

  awayTeam.goalsFor += awayScore;
  awayTeam.goalsAgainst += homeScore;
  awayTeam.goalDiff = awayTeam.goalsFor - awayTeam.goalsAgainst;
  awayTeam.points += awayPoints;
  awayTeam.wins += awayWins;
  
  const deltaRating = homeTeam.rating - awayTeam.rating +HFA;
  const winExpectancy = (1 / (1 + Math.pow(10, -(deltaRating) / DIVISOR_ELO)));
  const adjust = IMPORTANCE * factor * (result - winExpectancy);
  homeTeam.rating += adjust;
  awayTeam.rating -= adjust;


}

function simulateMatchELOHFA(casa, fora) {
  let [winExpectancy, drawExpectancy] = expectancy(casa, fora);
  //const exp = new Expectancy(casa, fora);
  //const winExpectancy = exp.win;
  //const drawExpectancy = exp.draw;
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
    } else{
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
  return [ homeScore, awayScore];  
}

function runSimulation(upcomingMatches, realCampaign, N_SIMS, method) {
    let tabelaProbs = [];
    let stats = new Map();

    for (let t of Object.values(realCampaign)) {
        stats.set(t.name, new Summary(t.name));
    }

    for (let i = 0; i < N_SIMS; i++) {
      if(i % (N_SIMS/20) == 0) {
        postMessage(['progress', 100*i/N_SIMS]);
      }
        let dicTimes = new Map();
        realCampaign.forEach((team, name) => {
            dicTimes.set(name, { ...team });
        });

        for (let j of upcomingMatches) {
            if (!dicTimes.has(j.homeTeam)) {
                dicTimes.set(j.homeTeam, new Team(j.homeTeam, j.homeBadge));
            }
            if (!stats.has(j.homeTeam)) {
                stats.set(j.homeTeam, new Summary(j.homeTeam));
            }
            if (!dicTimes.has(j.awayTeam)) {
                dicTimes.set(j.awayTeam, new Team(j.awayTeam, j.awayBadge));
            }
            if (!stats.has(j.awayTeam)) {
                stats.set(j.awayTeam, new Summary(j.awayTeam));
            }
            let [homeScore, awayScore] = method(dicTimes.get(j.homeTeam), dicTimes.get(j.awayTeam));
            computeMatch(dicTimes.get(j.homeTeam), dicTimes.get(j.awayTeam), homeScore, awayScore);

        }

        let classif = [];
        dicTimes.forEach((team, name) => {
            let teamInDic = { ...team };
            classif.push(teamInDic);
        });
        classif.sort((a, b) => compareTeams(a, b));


        for (let pos = 0; pos < classif.length; pos++) {
            let teamName = classif[pos].name;
            let teamStats = stats.get(teamName);
            teamStats.histograma[pos] = teamStats.histograma[pos] + 1;
            let teamPoints = dicTimes.get(teamName).points;
            teamStats.histPontos[teamPoints] = teamStats.histPontos[teamPoints]?teamStats.histPontos[teamPoints]+1:1; 
        }
        stats.get(classif[0].name).titulos += 1;
        for (let j = 0; j < 4; j++) {
            stats.get(classif[j].name).g4s += 1;
            stats.get(classif[19 - j].name).z4s += 1;
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
        let tabelaProbs = runSimulation(e.data[1], e.data[2], e.data[3], simulateMatchELOHFA);
        postMessage(["done", tabelaProbs]);    
    }
}