import { DIVISOR_ELO, IMPORTANCE, N_SIMS, HFA, PCT_VITORIA_SALDO_5, PCT_VITORIA_SALDO_4, PCT_VITORIA_SALDO_3, PCT_VITORIA_SALDO_2, PCT_EMPATE_0, PCT_EMPATE_1, PCT_EMPATE_2, PCT_DERROTA_1 , PCT_DERROTA_2, N_RUNS, RUNS, Summary, expectancy, compareTeams, Team, computeMatch, simulateMatchELOHFA, computePastMatches} from './base.js'; 


function poisson(lambda) {
  let L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while ( p > L );
  return k - 1;
}

function simulateMatchAgnostic(){
  return [ poisson(1.25), poisson(1.25)]; 
}

function simulateMatchAgnosticHFA(){
  return [ poisson(1.38), poisson(1.05)];
}

function runSimulation(upcomingMatches, realCampaign, N_SIMS, method) {
    let tabelaProbs = [];
    let stats = new Map();

    for (let [name, team] of realCampaign) {
        stats.set(name, new Summary(name));
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
            try {
            teamStats.histograma[pos] = teamStats.histograma[pos] + 1;
            let teamPoints = dicTimes.get(teamName).points;
            teamStats.histPontos[teamPoints] = teamStats.histPontos[teamPoints]+1; 
            } catch (e) {
                console.log(pos, teamName, teamStats);
            }
        }
        stats.get(classif[0].name).titulos += 1;
        for (let j = 0; j < 4; j++) {
            stats.get(classif[j].name).g4s += 1;
            stats.get(classif[19 - j].name).z4s += 1;
        }

    }
    tabelaProbs = [];
    let originalOrder = [...stats.keys()];
    originalOrder.sort(
        (a,b) => compareTeams(realCampaign.get(a), realCampaign.get(b))
    );
    for (let teamName of originalOrder){
        tabelaProbs.push(stats.get(teamName));
    }
    //for (let e of stats.values()) {
    //    tabelaProbs.push(e);
    //}
    //tabelaProbs.sort((a, b) => a.compareTo(b));
    return tabelaProbs;
}

onmessage = e => {
    if (e.data[0] == 'run') {
        let tabelaProbs = runSimulation(e.data[1], e.data[2], e.data[3], simulateMatchELOHFA);
        postMessage(["done", tabelaProbs]);    
    }
}
