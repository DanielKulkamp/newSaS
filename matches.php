<?php
//require_once 'simple_html_dom.php';

class Game {
    public $homeTeam;
    public $awayTeam;
    public $homeScore;
    public $awayScore;
    public $done;

    public function __construct($timeCasa, $timeFora, $golsCasa = "", $golsFora = "") {
        $this->homeTeam = $timeCasa;
        $this->awayTeam = $timeFora;
        $this->homeScore = $golsCasa;
        $this->awayScore = $golsFora;
        if ($golsCasa == "" || $golsFora == "") {
          $this->done = false;
        } else {
          $this->done = true;
        }
    }
}

class SiteCBFMiner {
      
    private $gameList;
    private $url;
    private $badges;
  
    public function __construct($url){
      $this->gameList = array();
      $this->badges = array();
      $this->url = $url;

      try {
        ini_set('memory_limit', '256M');

        $doc = file_get_contents($this->url);
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $doc = curl_exec($ch);
        curl_close($ch);
        


        $doc = preg_replace('/\r*\n\r*/m', "", $doc); 
        
        /*
          <div class="time pull-left"><span class="time-sigla">AME</span> <img src="https://conteudo.cbf.com.br/cdn/imagens/escudos/59897mg.jpg?v=2023041515" title="América Fc Saf - MG" alt="América Fc Saf - MG" onerror="this.src='https://conteudo.cbf.com.br/cdn/imagens/escudos/empty.jpg'" class="icon escudo x45 pull-right"></div>
        */
        $reHomeTeams = "/time pull-left\"[^\"]*\"time-sigla\"[^\"]*img src=\"([^\?]*)[^\"]*\"[^\"]*\"([^\"]*)/m";
        $reAwayTeams = "/time pull-right\"[^\"]*\"time-sigla\"[^\"]*img src=\"([^\?]*)[^\"]*\"[^\"]*\"([^\"]*)/m";
        //<strong class="partida-horario center-block">        18:30        </strong>
        $reHorarioPlacar = "/strong class=\"partida-horario center-block\">(.*?)<\/strong>/m";
        $contagemHome = preg_match_all($reHomeTeams, $doc, $badgesAndNamesHome, PREG_SET_ORDER, 0);
        $contagemAway = preg_match_all($reAwayTeams, $doc, $badgesAndNamesAway, PREG_SET_ORDER, 0);
        $contagemPlacar = preg_match_all($reHorarioPlacar, $doc, $placarHorario, PREG_SET_ORDER, 0);
        
        for ($i = 0; $i < $contagemPlacar; ++$i){
          $re = '/(\d+)\s*x\s*(\d+)/m';
          $homeScore = "";
          $awayScore = "";
          $done = false;
          if (preg_match_all($re, $placarHorario[$i][1], $matches, PREG_SET_ORDER, 0)){
            $homeScore = $matches[0][1];
            $awayScore = $matches[0][2];
            $this->badges[$badgesAndNamesHome[$i][2]] = $badgesAndNamesHome[$i][1];
            $this->badges[$badgesAndNamesAway[$i][2]] = $badgesAndNamesAway[$i][1];
            array_push($this->gameList, new Game($badgesAndNamesHome[$i][2], $badgesAndNamesAway[$i][2], $homeScore, $awayScore));
          } else {
            array_push($this->gameList, new Game($badgesAndNamesHome[$i][2], $badgesAndNamesAway[$i][2]));
          }
        }
        
      } catch (Exception $e) {
        echo 'Caught exception: ',  $e->getMessage(), "\n";
      }
    }

    public function getBadges() {
      return json_encode($this->badges);
    }
  
    public function getGameList() {      
      return json_encode($this->gameList);      
    }
}


$miner = new SiteCBFMiner( "https://www.cbf.com.br/futebol-brasileiro/competicoes/campeonato-brasileiro-serie-a/2023");
$jsonMatchList = $miner->getGameList();

?>
<HTML lang='pt-br'>
  <head>
    <meta charset="utf8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="Content-Type" content="text/html">
    <title>SAS - Campeonato Brasileiro 2023 - Série A</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script type='text/Javascript'>let listOfMatches <?php echo "= " . $jsonMatchList . ";" ?>
    let badgesDictionary <?php echo "= " . $miner->getBadges() . ";" ?>
    
    </script>
    <script type='text/Javascript' src='./script.js'></script>
  </head>
  <body>
    <style>
      table {
        text-align: center;
        font-size: x-large;
      }
      .progress {
        height: 20px;
        margin-bottom: 20px;
        overflow: hidden;
        background-color: #f5f5f5;
        border-radius: 4px;
      }

      .progress-bar {
        float: left;
        width: 0%;
        height: 100%;
        font-size: 12px;
        line-height: 20px;
        color: #fff;
        text-align: center;
        background-color: #337ab7;
        box-shadow: inset 0 -1px 0 rgba(0,0,0,.15);
      }
    </style>
    <h1>Simulador SAS - Brasileirão 2023 - Série A</h1>
    <div class="progress"><div class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
</div>
    <span class="navbar">      
      <button id="btMatches">Lista de Jogos</button>
      <button id="btRatings">Ratings e Campanha</button>
      <button id="btNextMatches">Próximos jogos</button>
      <button id="btSummary">Resultado Simulação</button>
      <button id="btGraphs">Gráficos</button>
      <button id="btNewSim">Nova Simulação</button>
    </span>
    <div class="panel" id="divMatches" ></div>
    <div class="panel" id="divRatings" ></div>
    <div class="panel" id="divNextMatches" ></div>
    <div class="panel" id="divSummary"></div>
    <div class="panel" id="divGraphs">
      <h3>Selecione 1 ou mais times e clique em "Gerar gráfico":</h3>
        <select id="item-select" multiple></select><button id="plot-button">Gerar gráfico</button>
        <h2>Probabilidade por colocação final:</h2>
        <canvas id="histogram-chart"></canvas>
    </div>
  </body>
</html>

        