const runSimulation = alistOfMatches => {
    let [ranking, realCampaign] = computePastMatches(alistOfMatches);
    displayRatings(ranking);
    let tabelaProbs = [];
    const upcomingMatches = alistOfMatches.filter(match => !match.done);
    let [ mandantes, visitantes, expectancies] = calculateNextExpectancies(upcomingMatches, realCampaign);
    displayNextMatches(mandantes, visitantes, expectancies);
    let overall = new Array(N_RUNS);
    for (let pass = 0; pass < N_RUNS; pass++) {
        let stats = new Map();
        for (let t of Object.values(realCampaign)) {
          stats.set(t.name, new Summary(t.name));
        }
        for (let i = 0; i < N_SIMS; i++) {
            let dicTimes = new Map();
            realCampaign.forEach((team, name) => {
              dicTimes.set(name, {...team}); 
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
                let [homeScore, awayScore] = simulateMatchELOHFA(dicTimes.get(j.homeTeam), dicTimes.get(j.awayTeam));
                computeMatch(dicTimes.get(j.homeTeam),dicTimes.get(j.awayTeam), homeScore, awayScore);

            }

            let classif = [];
            dicTimes.forEach((team, name) => {
              let teamInDic = {...team};
              classif.push(teamInDic)
            });
            classif.sort((a, b) => compareTeams(a, b));
            
            
            for (let pos = 0; pos < classif.length; pos++) {
                stats.get(classif[pos].name).histograma[pos] = stats.get(classif[pos].name).histograma[pos]+1;
            }
            stats.get(classif[0].name).titulos += 1;
            for (let j = 0; j < 4; j++) {
                stats.get(classif[j].name).g4s += 1;
                stats.get(classif[19 - j].name).z4s += 1;
            }
            overall[pass] = stats;
        }
        tabelaProbs = [];
        for (let e of stats.values()) {
          tabelaProbs.push(e);
        }
        tabelaProbs.sort((a, b) => a.compareTo(b));
 
    }
    console.log(overall);
    displaySummary(tabelaProbs);
    
};