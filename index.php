<?php
require_once 'miners.php';
date_default_timezone_set('America/Sao_Paulo');
$now = new DateTime('now',);
if (isset($_GET['tournament'])) {
    $tournament = $_GET['tournament'];
} else {
    $tournament = 'serie-a-' . $now->format('Y');
}

// obtem data do primeiro jogo não atualizado no banco de dados.
$pdo = new PDO('sqlite:db');
$query = $pdo->prepare('SELECT date FROM matches WHERE tournament = :tournament AND done = "0" and DATE != "" ORDER BY date ASC LIMIT 1');
$query->bindValue(':tournament', $tournament, PDO::PARAM_STR);
if ($query->execute()) {
    $firstPendingString = $query->fetch(PDO::FETCH_ASSOC)['date'];
    $firstPending = new DateTime($firstPendingString);
} else {
    echo "error on getting first undone match\n";
}

// obter lista de jogos:
$delta = DateInterval::createFromDateString('2 hour 30 minute');
$firstPending->add($delta);
if ($now > $firstPending || isset($_GET['forceUpdate'])) {  
    echo 'updating '. $tournament .'';
    $url = 'https://www.cbf.com.br/futebol-brasileiro/competicoes/campeonato-brasileiro-' . substr($tournament, 0, 7) . '/' . substr($tournament, 8, 4);
    $miner = new SiteCBFMiner($url, $tournament);
    [$gameList, $errors] = $miner->atualizaJogos($pdo);
    $miner->cadastraEscudos($pdo);
} else {
    $query = $pdo->prepare('SELECT * FROM matches WHERE tournament = :tournament');
    $query->bindValue(':tournament', $tournament, PDO::PARAM_STR);
    if ($query->execute()) {
        $gameList = $query->fetchAll(PDO::FETCH_CLASS);
    } else {
        echo "error\n";
    }
}
// obter lista de escudos:
$query = $pdo->prepare('SELECT DISTINCT matches.homeTeam, badges.url from MATCHES inner join(badges) on matches.homeTeam = badges.team where tournament = :tournament');
$query->bindValue(':tournament', $tournament, PDO::PARAM_STR);
$query->execute();
$badges = [];
foreach ($query as $pair) {
    $badges[$pair['homeTeam']] = $pair['url'];
}

?>
<html>
  <head>
    <title>S.A.S. 2024</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta charset="utf8">
    <meta http-equiv="Content-Type" content="text/html">
    <script src = "https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script> 
        let listOfMatches = <?php echo json_encode($gameList) ?>; 
        let badgesDictionary = <?php echo json_encode($badges) ?>;
    </script>
    <script src="script.js"></script>
   
    <style>
body, html {
  padding: 0;
  margin: 0;
  overflow-x: hidden;
  width: 100%;
  height: 100%;
  text-align: center;
}

.slide {
  display: flex;
  justify-content: space-around;
  flex-direction: column;
  position: absolute;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  width: 100%;
  height: calc(100vh - 70px);
  overflow: auto;
  padding: 70 70 0 0;
  top: 0;
  left: 0;
  transition-duration: .4s;
}

#menuPanel {
  position: absolute;
  top: 70px;
  left: 0px;
  background-color: rgba(240, 240, 240, 0.3);
  transition-duration: .4s;
  z-index: 23;
}

#menuPanel * {
  display: block;
}
.right {
  transform: translate(100%);
}
.left {
  transform: translate(-100%);
}

#menuButton {
  background-color: rgba(192, 192, 192, 0.75);
  border: none;
  color: white;
  padding: 5px 5px;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  display: inline;
  margin: 3px, 3px;
}

#titlebar {
  position: absolute;
  text-align: left;
  top: 0;
  left: 0;
  width: 100%;
  border: none;
  padding: 2;
  background-color: rgba(128,128,128,0.75);
  font-size: 3rem;
  z-index: 23;
}

.content {
  width: calc(100vw - 160px);
  height: calc(100vh - 160px);
  position: absolute;  
  top: 70px;
  left: 80px;
  bottom: 70px;
  overflow-y: scroll;
}

.content table {
  text-align: center;
  align-content: center;
}

.content * {
  background-color: rgba(255, 255, 255, 0.25);
}
.bg1 {
  background-image: url(./img/1.jpeg);
}
.bg2 {
  background-image: url(./img/2.jpeg);
}
.bg3 {
    background-image: url(./img/3.jpeg);
}
.bg4 {
    background-image: url(./img/4.jpeg);
}
.bg5 {
    background-image: url(./img/5.jpeg);
}

    </style>
  </head>
  <body>
    <span id="titlebar">
      <button id="menuButton">
       <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
          <line x1="5" y1="9" x2="36" y2="9" style="stroke:#000000;stroke-width:5" />
          <line x1="5" y1="17" x2="36" y2="17" style="stroke:#000000;stroke-width:5" />
          <line x1="5" y1="25" x2="36" y2="25" style="stroke:#000000;stroke-width:5" />
          <line x1="5" y1="33" x2="36" y2="33" style="stroke:#000000;stroke-width:5" />
          <line x1="4" y1="8" x2="35" y2="8" style="stroke:#FFFFFF;stroke-width:5" />
          <line x1="4" y1="16" x2="35" y2="16" style="stroke:#FFFFFF;stroke-width:5" />
          <line x1="4" y1="24" x2="35" y2="24" style="stroke:#FFFFFF;stroke-width:5" />
          <line x1="4" y1="32" x2="35" y2="32" style="stroke:#FFFFFF;stroke-width:5" />
        </svg>
      </button><span class="title">S.A.S 2024</span></span>
      <div id="menuPanel" class="left">
        <button class="menuItemButton" id="btMatches">Lista de Jogos</button>
        <button class="menuItemButton" id="btNextMatches">Próximos Jogos</button>
        <button class="menuItemButton" id="btTable">Classificação</button>
        <button class="menuItemButton" id="btResult">Resultado</button>
        <button class="menuItemButton" id="btGraph">Gráficos</button>
        <div>-</div>
        <button id="ntNewSim">Nova simulação</button>
      </div><div>
      <div class="slide bg1"><div id="divMatches" class="content">Blablabla</div></div>
      <div class="slide bg2 right"><div class="content" id="divNextMatches"></div></div>
      <div class="slide bg3 right"><div class="content" id="divRatings"></div></div>
      <div class="slide bg4 right"><div class="content" id="divSummary"></div></div>
      <div class="slide bg5 right"><div class="content" id="divGraphs">      <h3>Selecione 1 ou mais times e clique em "Gerar gráfico":</h3>
        <select id="item-select" multiple></select><button id="plot-button">Projeção de Posição</button><button id="plot-points">Projeção de Pontos</button>
        <h2 id="graph-title"></h2>
        <canvas id="histogram-chart"></canvas></div>
      </div>

      </div>



      <div class="footer">.</div>
  </body>
</html>
