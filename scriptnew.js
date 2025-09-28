import { getListOfMatches } from './updater.js';
var chart;
import { DIVISOR_ELO, IMPORTANCE, N_SIMS, HFA, PCT_VITORIA_SALDO_5, PCT_VITORIA_SALDO_4, PCT_VITORIA_SALDO_3, PCT_VITORIA_SALDO_2, PCT_EMPATE_0, PCT_EMPATE_1, PCT_EMPATE_2, PCT_DERROTA_1, PCT_DERROTA_2, N_RUNS, RUNS, Summary, expectancy, compareTeams, Team, computeMatch, simulateMatchELOHFA, computePastMatches } from './base.js';


let listOfMatches;
var t1 = 4;
var t2 = 6;
var t3 = 12;
var y = 0;
var z = 4;

/**
 * Updates the: ratings and campaign panel 
 * @param {*} ratings : an array of Team sorted by ratings
 */

function displayRatings(ratings) {
	let rows = [];
	for (let i = 0; i < ratings.length; i++) {
		let t = ratings[i];
		rows.push(
			`<tr>
        <td>${i + 1}</td>
        <td class="nome">${t.name}</td>
        <td class="number">${t.rating.toFixed(2)}</td>
		<td>${(100.0 * t.points / (3.0 * t.matches)).toFixed(2)}%</td>
        <td>${t.points}</td>
        <td>${t.matches}</td>
        <td>${t.wins}</td>
        <td>${t.goalDiff}</td>
        <td>${t.goalsFor}</td>
        <td>${t.goalsAgainst}</td>
      </tr>`);
	}
	let table = `<h2>ratings e campanha</h2>
      <table border='1'>
      <tr>
        <th>#</th>
        <th>time</th>
        <th>rating</th>
		<th>aprov</th>
        <th>pg</th>
        <th>j</th>
        <th>v</th>
        <th>sg</th>
        <th>gp</th>
        <th>gc</th>
      </tr>` + rows.join("") + "</table>";
	document.getElementById("divRatings").innerHTML = table;

}

function enableEditGame(event) {
	let button = event.srcElement;
	let index = button.id.substring(11);
	let td_home = document.getElementById(`homeScore_${index}`);
	let td_away = document.getElementById(`awayScore_${index}`);
	let homeScore = td_home.innerHTML;
	let awayScore = td_away.innerHTML;
	td_home.innerHTML = `<input type='number' min='0' id='inputHome_${index}' value='${homeScore}'>`
	td_away.innerHTML = `<input type='number' min='0' id='inputAway_${index}' value='${awayScore}'>`
	button.removeEventListener('click', enableEditGame);
	button.addEventListener('click', saveEditedGame);
	button.innerHTML = "Salvar";
}

function saveEditedGame(event) {
	let button = event.srcElement;
	let index = button.id.substring(11);
	let homeInput = document.getElementById(`inputHome_${index}`);
	let awayInput = document.getElementById(`inputAway_${index}`);
	let g = listOfMatches[parseInt(index)];
	if (homeInput.value === "" || awayInput.value === "") {
		g.done = false;
	} else {
		g.done = true;
	}
	g.homeScore = homeInput.value;
	g.awayScore = awayInput.value;
	document.getElementById(`homeScore_${index}`).innerHTML = "" + g.homeScore;
	document.getElementById(`awayScore_${index}`).innerHTML = "" + g.awayScore;

	button.removeEventListener('click', saveEditedGame);
	button.addEventListener('click', enableEditGame)
	button.innerHTML = "Editar";

}

function displayListOfMatches(listOfMatches) {
	let table = "<h2>Lista completa de jogos</h2><table border='1'><tr><th>#</th><th>Rodada</th><th>Mandante</th><th></th><th>x</th><th></th><th>Visitante</th><th>Data</th></tr>";
	let firstUndone = listOfMatches.filter(a => !a.done)[0];
	listOfMatches.forEach((game, i) => {

		let data = game.date ? game.date : "a definir";
		table += `<tr id="jogo${game.number}">
          <td>${game.number}</td>
          <td>${game.round}</td>
          <td>${game.homeTeam}</td>
          <td id="homeScore_${i}">${game.homeScore}</td>
          <td>X</td>
          <td id="awayScore_${i}">${game.awayScore}</td>
          <td>${game.awayTeam}</td>
          <td>${data}</td>
          <td><button class="editMatchButton" id="editButton_${i}">Editar</button></td>

      </tr>`;
	});
	table += "</table>";
	document.getElementById("divMatches").innerHTML = table;
	document.getElementById(`jogo${firstUndone.number}`).scrollIntoView({ behavior: 'smooth' });
	for (const button of document.getElementsByClassName("editMatchButton")) {
		button.addEventListener('click', enableEditGame);

	}
}

function displayNextMatches(homeTeams, awayTeams, expectancies) {
	let rows = homeTeams.map((homeTeam, i) => {
		return `
    <tr>
      <td>${homeTeam.name}</td>
      <td>${homeTeam.rating.toFixed(2)}</td>
      <td>${(100 * expectancies[i][0]).toFixed(2)}%</td>
      <td>${(100 * expectancies[i][1]).toFixed(2)}%</td>
      <td>${(100 * expectancies[i][2]).toFixed(2)}%</td>
      <td>${awayTeams[i].rating.toFixed(2)}</td>
      <td>${awayTeams[i].name}</td>
    </tr>
  `});

	let table = `<h2>Probabilidades nos Próximos Jogos</h2><table border='1'>
  <tr>
      <th>Mandante</th>
      <th>Rating</th>
      <th>Vitória mandante</th>
      <th>Empate</th>
      <th>Vitória visitante</th>
      <th>Rating</th>
      <th>Visitante</th>
  </tr>${rows.join("")}</table>`;

	document.getElementById("divNextMatches").innerHTML = table;

}



/**
 * Calculate the win/draw/loss expectancy of the next 10 upcoming matches.
 * @param {*} upcomingMatches a list of upcoming matches
 * @param {*} realCampaign a
 * @returns 
 */
function calculateNextExpectancies(upcomingMatches, realCampaign) {
	const mandantes = [];
	const visitantes = [];
	const expectancies = [];

	for (let i = 0; i < upcomingMatches.length; i++) {
		let casa = realCampaign.get(upcomingMatches[i].homeTeam);
		if (casa === undefined) {
			casa = new Team(upcomingMatches[i].homeTeam);
		}
		let fora = realCampaign.get(upcomingMatches[i].awayTeam);
		if (fora === undefined) {
			fora = new Team(upcomingMatches[i].awayTeam);
		}
		const exp = expectancy(casa, fora);
		mandantes.push(casa);
		visitantes.push(fora);
		expectancies.push(exp);
	}
	return [mandantes, visitantes, expectancies];
}

function displaySummary(summary, n_sims) {
	console.log(summary, n_sims);
	let table = `<h2>Resumo da Simulação</h2>
                    <table border='1'>
                    <tr><th>#</th><th>Time</th>
                    <th>Título</th>
                    <th>G${t1}</th>
                    <th>G${t1 + 1}-${t2}</th>
                    <th>G${t2 + 1}-${t3}</th>
					<th>Neutro</th>
					${y !== 0 ? '<th>Playoff</th>' : ''}
                    <th>Z${z}</th>
                    </tr>`;
	summary.forEach((stats, i) => {

		table += `<tr><td>${i + 1}</td>
                    <td class="nome">${stats.nome}</td>
                    <td>${(100 * stats.histograma[0] / n_sims).toFixed(2)}</td>
                    <td>${(100 * stats.histograma.slice(0, t1).reduce((a, b) => a + b) / n_sims).toFixed(2)}</td>
                    <td>${(100 * stats.histograma.slice(t1, t2).reduce((a, b) => a + b) / n_sims).toFixed(2)}</td>
                    <td>${(100 * stats.histograma.slice(t2, t3).reduce((a, b) => a + b) / n_sims).toFixed(2)}</td>
                    <td>${(100 * stats.histograma.slice(t3, stats.histograma.length - z - y).reduce((a, b) => a + b) / n_sims).toFixed(2)}</td>
					${y !== 0 ? '<td>' + (100 * stats.histograma.slice(stats.histograma.length - z - y, stats.histograma.length - z).reduce((a, b) => a + b) / n_sims).toFixed(2) + '</td>' : ''
			}
                    <td>${(100 * stats.histograma.slice(stats.histograma.length - z, stats.histograma.length).reduce((a, b) => a + b) / n_sims).toFixed(2)}</td>
                </tr>`;
	});
	table += "</table>";
	document.getElementById("divSummary").innerHTML = table;
	displayGraphs(summary);
}

function plotPosition(summary) {
	return function() {
		var itemSelect = document.getElementById("item-select");

		// Find the selected items in the array
		var selectedItems = [];
		var selectedOptions = Array.from(itemSelect.selectedOptions);
		for (var i = 0; i < selectedOptions.length; i++) {
			var selectedItem = summary.find(function(item) {
				return item.nome === selectedOptions[i].value;
			});
			if (selectedItem) {
				selectedItems.push(selectedItem);
			}
		}

		var colorPalette = ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a", "#ffff99", "#b15928", "#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#fccde5", "#d9d9d9"];
		// Update the chart data object
		var chartData = {
			labels: selectedItems[0].histograma.map(function(_, index) {
				return "" + (index + 1) + "º";
			}),
			datasets: selectedItems.map(function(item, index) {
				return {
					label: item.nome,
					backgroundColor: colorPalette[index % colorPalette.length],
					borderColor: colorPalette[index % colorPalette.length],
					borderWidth: 1,
					data: item.histograma.map(a => 100.0 * a / (N_SIMS * N_RUNS))
				};
			})
		};

		// Update the chart options object
		var chartOptions = {
			plugins: {
				title: {
					display: true,
					text: 'Projeção de Posição Final'
				}
			},
			scales: {
				x: {
					title: {
						display: true,
						text: 'Posição'
					}
				},
				y: {
					title: {
						display: true,
						text: 'Probabilidade (%)'
					},
					ticks: {
						beginAtZero: true
					}
				},
			}
		};

		// Destroy any existing chart objects
		if (chart !== undefined) {
			chart.destroy();
		}

		// Create the chart object
		var histogramCanvas = document.getElementById("histogram-chart");
		chart = new Chart(histogramCanvas, {
			type: 'bar',
			data: chartData,
			options: chartOptions
		});
	}
}

function plotPointsFunction(summary) {
	return function() {
		// Find the selected items in the array
		var itemSelect = document.getElementById("item-select");
		var selectedItems = [];
		var selectedOptions = Array.from(itemSelect.selectedOptions);
		for (var i = 0; i < selectedOptions.length; i++) {
			var selectedItem = summary.find(function(item) {
				return item.nome === selectedOptions[i].value;
			});
			if (selectedItem) {
				selectedItems.push(selectedItem);
			}
		}

		var colorPalette = ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a", "#ffff99", "#b15928", "#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#fccde5", "#d9d9d9"];
		// Update the chart data object
		var chartData = {
			labels: selectedItems[0].histPontos.map(function(_, index) {
				return index;
			}),
			datasets: selectedItems.map(function(item, index) {
				return {
					label: item.nome,
					backgroundColor: colorPalette[index % colorPalette.length],
					borderColor: colorPalette[index % colorPalette.length],
					borderWidth: 1,
					data: item.histPontos.map(a => 100.0 * a / (N_SIMS * N_RUNS))
				};
			})
		};

		// Update the chart options object
		var chartOptions = {
			plugins: {
				title: {
					display: true,
					text: 'Projeção de Pontuação Final'
				}
			},
			scales: {
				x: {
					title: {
						display: true,
						text: 'Pontos'
					}
				},
				y: {
					title: {
						display: true,
						text: 'Probabilidade (%)'
					},
					ticks: {
						beginAtZero: true
					}
				},
			}
		};

		// Destroy any existing chart objects
		if (chart !== undefined) {
			chart.destroy();
		}

		// Create the chart object
		var histogramCanvas = document.getElementById("histogram-chart");
		chart = new Chart(histogramCanvas, {
			type: 'bar',
			data: chartData,
			options: chartOptions
		});
	}
}

function plotPointsCumulativeFunction(summary) {
	return function() {
		// Find the selected items in the array
		var itemSelect = document.getElementById("item-select");
		var selectedItems = [];
		var selectedOptions = Array.from(itemSelect.selectedOptions);
		for (var i = 0; i < selectedOptions.length; i++) {
			var selectedItem = summary.find(function(item) {
				return item.nome === selectedOptions[i].value;
			});
			if (selectedItem) {
				selectedItems.push(selectedItem);
			}
		}

		var colorPalette = ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a", "#ffff99", "#b15928", "#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#fccde5", "#d9d9d9"];
		// Update the chart data object
		var chartData = {
			labels: selectedItems[0].histPontos.map(function(_, index) {
				return index;
			}),
			datasets: selectedItems.map(function(item, index) {
				let acc = 100.0;
				let pointsCumulative = item.histPontos.map(a => {
					let curr = (100.0 * a / (N_SIMS * N_RUNS));
					let ret = acc;
					acc -= curr;
					return ret;
				});
				return {
					label: item.nome,
					backgroundColor: colorPalette[index % colorPalette.length],
					borderColor: colorPalette[index % colorPalette.length],
					borderWidth: 1,
					data: pointsCumulative,
				};
			})
		};

		// Update the chart options object
		var chartOptions = {
			plugins: {
				title: {
					display: true,
					text: 'Probabilidade de atingir ou superar de Pontuação Final'
				}
			},
			scales: {
				x: {
					title: {
						display: true,
						text: 'Pontos'
					}
				},
				y: {
					min: 0,
					title: {
						display: true,
						text: 'Probabilidade (%)'
					},
					ticks: {
						beginAtZero: true
					},
				},
			}
		};

		// Destroy any existing chart objects
		if (chart !== undefined) {
			chart.destroy();
		}

		// Create the chart object
		var histogramCanvas = document.getElementById("histogram-chart");
		chart = new Chart(histogramCanvas, {
			type: 'bar',
			data: chartData,
			options: chartOptions
		});
	}
}

function displayGraphs(summary) {
	// Get a reference to the select element and the button element
	var itemSelect = document.getElementById("item-select");
	var plotButton = document.getElementById("plot-button");
	var plotPoints = document.getElementById("plot-points");
	var plotPointsCumulative = document.getElementById("plot-points-cumulative");

	// Populate the select element with the names of the items in the array
	itemSelect.innerHTML = "";
	for (var i = 0; i < summary.length; i++) {
		var option = document.createElement("option");
		option.text = summary[i].nome;
		itemSelect.add(option);
	}

	// Add an event listener to the button element
	plotButton.addEventListener("click", plotPosition(summary));
	plotPoints.addEventListener("click", plotPointsFunction(summary));
	plotPointsCumulative.addEventListener("click", plotPointsCumulativeFunction(summary));
}



const clickHandler = (clickEvent) => {
	let mapinha = [...document.querySelectorAll(".menuItemButton")].map((x, i, arr) => [i, x]);
	let buttonIndex = mapinha.filter((el, i, arr) => el[1].id == clickEvent.srcElement.id)[0][0];
	let pannels = document.querySelectorAll(".slide");
	document.querySelector("#menuPanel").classList.add("left");
	for (let i = 0; i < pannels.length; i++) {
		let cl = pannels[i].classList;
		if (i < buttonIndex) {
			cl.remove("right");
			cl.add("left");
		}
		if (i == buttonIndex) {
			cl.remove("left");
			cl.remove("right");
		}
		if (i > buttonIndex) {
			cl.remove("left");
			cl.add("right");
		}
	}
};

function showPanel(id) {
	const element = document.querySelector(id).parentElement;
	console.log(element);
	element.classList.remove("left");
	element.classList.remove("right");
	let sibling = element.previousElementSibling;

	while (sibling) {
		sibling.classList.remove("right");
		sibling.classList.add("left");
		sibling = sibling.previousElementSibling;
	}
	sibling = element.nextElementSibling;
	while (sibling) {
		sibling.classList.add("right");
		sibling.classList.remove("left");
		sibling = sibling.nextElementSibling;
	}
}


function messageFromWorker(event) {
	let data = event.data;
	if (data[0] == 'done') {
		RUNS.push(data[1]);
		if (RUNS.length == N_RUNS) {
			document.querySelector("#progDialog").close();
			let consolidado = RUNS.reduce((acc, curr, index, arr) => {
				let newAcc = [];
				for (let item of curr) {
					let itemInAcc = acc.filter(x => x.nome == item.nome)[0];
					item.titulos += itemInAcc.titulos;
					item.z4s += itemInAcc.z4s;
					for (let val in item.histograma) {
						item.histograma[val] += itemInAcc.histograma[val];
					}
					for (let pts in item.histPontos) {
						item.histPontos[pts] += itemInAcc.histPontos[pts];
					}
					newAcc.push(item);
				}
				return newAcc;
			});
			displaySummary(consolidado, N_SIMS * N_RUNS);
			displayBrierScore(consolidado, N_SIMS * N_RUNS);
			showPanel("#divSummary");
		}
	}
	if (data[0] == 'progress') {
		let prog = document.querySelector("#simProg");
		prog.value = parseFloat(prog.value) + 5 / N_RUNS;

	}
	if (data[0] == 'info') console.log(data[1]);
}


function runSimulation(n_teams, n_rounds) {
	let [ranking, realCampaign] = computePastMatches(listOfMatches);
	const upcomingMatches = listOfMatches.filter(match => !match.done);
	displayRatings(ranking);
	let [mandantes, visitantes, expectancies] = calculateNextExpectancies(upcomingMatches, realCampaign);
	displayNextMatches(mandantes, visitantes, expectancies);
	RUNS.length = 0;
	document.querySelector("#simProg").value = 0;
	document.querySelector("#progDialog").showModal();
	var itemSelect = document.querySelector("#method");
	//var selectedItems = [];
	var selectedOption = Array.from(itemSelect.selectedOptions)[0].value;
	console.log(selectedOption);
	for (let i = 0; i < N_RUNS; i++) {
		let worker = new Worker("worker.js", { type: 'module' });
		worker.onmessage = messageFromWorker;
		worker.postMessage(['run', upcomingMatches, realCampaign, N_SIMS, selectedOption, n_teams, n_rounds]);
	}
}

document.addEventListener('DOMContentLoaded', (_event) => {
	document.querySelector("#menuButton").addEventListener('click', (e) => {
		let menuPanel = document.querySelector("#menuPanel");
		if (menuPanel.classList.contains("left")) {
			menuPanel.classList.remove("left");
		} else {
			menuPanel.classList.add("left");
		}
	});

	document.querySelectorAll(".menuItemButton").forEach(x => (
		x.addEventListener('click', clickHandler)
	));
	document.querySelector("#btNewSim").addEventListener('click', runSimulation);
	const parametros = new URLSearchParams(window.location.search);

	// Acessando os valores
	const tournament = parametros.get('t') ?? 325;   // 'Daniel'
	const season = parametros.get('s') ?? 72034;
	const rounds = parametros.get('r') ?? 38;
	const n_teams = parametros.get('n') ?? 20;
	t1 = 1 * (parametros.get('t1') ?? t1);
	t2 = 1 * (parametros.get('t2') ?? t2);
	t3 = 1 * (parametros.get('t3') ?? t3);
	console.log(t1, t2, t3);
	y = 1 * (parametros.get('y') ?? y);
	z = 1 * (parametros.get('z') ?? z);
	console.log(`t: ${tournament}, s: ${season}, r: ${rounds}, n: ${n_teams}`);

	getListOfMatches(tournament, season, rounds).then(l => {
		listOfMatches = l;
		listOfMatches.sort((a, b) => {
			if (a.timestamp > b.timestamp) return 1;
			if (a.timestamp == b.timestamp) return a.number - b.number;
			return -1;
		});
		displayListOfMatches(listOfMatches);
		runSimulation(n_teams, rounds);
	}); //fecha o then
});

function helperBrier(index, teamStats, start, stop) {
	return ((index >= start && index < stop ? 1 : 0) - teamStats.histograma.slice(start, stop).reduce((a, b) => a + b) / (N_RUNS * N_SIMS)) ** 2;
}

function displayBrierScore(summary, n_sims) {
	for (let i = 0; i < listOfMatches.length; i++) {
		if (!listOfMatches[i].done && listOfMatches[i].homeScore != "" && listOfMatches[i].awayScore != "") {
			listOfMatches[i].done = 1;
		}
	}
	let [ranking, realCampaign] = computePastMatches(listOfMatches);
	ranking.sort((a, b) => a.compareTo(b));
	let table = `<h2>Brier Score</h2>
                    <table border='1'>
                    <tr><th>#</th><th>Time</th>
                    <th>Título</th>
                    <th>G4</th>
                    <th>G6</th>
                    <th>G7-12</th>
                    <th>G13-16</th>
                    <th>Z4</th>
                    <th>Î£1</th>
                    <th>Î£2</th><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td> 
                    </tr>`;
	let brScore = 0;
	let brScoreGrand = 0;
	for (let index = 0; index < ranking.length; index++) {
		let team = ranking[index];
		let teamStats = summary.filter(x => x.nome == team.name)[0];
		console.log(teamStats);
		let brTitle = helperBrier(index, teamStats, 0, 1);
		let brG4 = helperBrier(index, teamStats, 0, 4);
		let brG6 = helperBrier(index, teamStats, 0, 6);
		let brG712 = helperBrier(index, teamStats, 6, 12);
		let brG1316 = helperBrier(index, teamStats, 12, 16);
		let brZ4 = helperBrier(index, teamStats, 16, 20);
		let teamTotal = brTitle + brG4 + brG6 + brG712 + brG1316 + brZ4;
		let teamGrandTotal = 0;
		let details = "";
		for (let [pos, count] of teamStats.histograma.entries()) {
			let posBrier = ((pos == index ? 1 : 0) - count / n_sims) ** 2;
			teamGrandTotal += posBrier;
			details = details += `<td class="brier">${posBrier.toFixed(2)}</td>`;
		}

		brScoreGrand += teamGrandTotal;
		brScore += teamTotal;
		table += `<tr><td>${index + 1}</td><td>${teamStats.nome}</td>
    <td class="brier">${brTitle.toFixed(2)}</td>
    <td class="brier">${brG4.toFixed(2)}</td>
    <td class="brier">${brG6.toFixed(2)}</td>
    <td class="brier">${brG712.toFixed(2)}</td>
    <td class="brier">${brG1316.toFixed(2)}</td>
    <td class="brier">${brZ4.toFixed(2)}</td>
    <td class="brier">${teamTotal.toFixed(2)}</td>
    <td class="brier">${teamGrandTotal.toFixed(2)}</td>${details}</tr>`;
	}
	table += `</table><h2>Total: ${brScore.toFixed(2)} Grand: ${brScoreGrand.toFixed(2)}</h2>`;

	document.getElementById("hidden").innerHTML = table;
	document.querySelectorAll(".brier").forEach(element => {
		element.style.backgroundColor = "rgba(255,0,0," + element.innerHTML + ")";
	});
}

/*em vez do runSimulation()...
 let [ranking, realCampaign] = computePastMatches(listOfMatches);
	const upcomingMatches = listOfMatches.filter(match => !match.done);
	displayRatings(ranking);
	let [mandantes, visitantes, expectancies] = calculateNextExpectancies(upcomingMatches, realCampaign);
	displayNextMatches(mandantes, visitantes, expectancies);
	for (let i = 0; i < N_RUNS; i++) {
	  let worker = new Worker("worker.js");
	  worker.onmessage = messageFromWorker;
	  worker.postMessage(['run', upcomingMatches, realCampaign, N_SIMS]);
	}

 */
