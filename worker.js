import { DIVISOR_ELO, IMPORTANCE, N_SIMS, HFA, PCT_VITORIA_SALDO_5, PCT_VITORIA_SALDO_4, PCT_VITORIA_SALDO_3, PCT_VITORIA_SALDO_2, PCT_EMPATE_0, PCT_EMPATE_1, PCT_EMPATE_2, PCT_DERROTA_1, PCT_DERROTA_2, N_RUNS, RUNS, Summary, expectancy, compareTeams, Team, computeMatch, simulateMatchELOHFA, computePastMatches, simulateMatchAgnostic, simulateMatchAgnosticHFA, simulateMatchELOHFAOld  } from './base.js';

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
        let dicTimes = new Map;
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
        let upcomingMatches = e.data[1];
        let realCampaign = e.data[2];
        let n_sims = e.data[3];
        let method_name = e.data[4];
        postMessage(["info", ["method_name", method_name]]);
        let method = ({ 
            "ELOHFA": simulateMatchELOHFA,
            "Agnostic": simulateMatchAgnostic,
            "AgnosticHFA": simulateMatchAgnosticHFA,
            "ELOHFAOld": simulateMatchELOHFAOld,
        })[method_name];
        method = method?method:simulateMatchELOHFA;
        let tabelaProbs = runSimulation(upcomingMatches, realCampaign, n_sims, method);
        postMessage(["done", tabelaProbs]);    
    }
}
