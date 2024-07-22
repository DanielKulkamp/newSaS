<?php
require_once 'miners.php';

$now = new DateTime("now");
if(isset($_GET['tournament'])){
    $tournament = $_GET['tournament'];
} else {
  $tournament = 'serie-a-' . $now->format("Y");
}

//obtem data do primeiro jogo não atualizado no banco de dados.
$pdo = new PDO('sqlite:db');
$query = $pdo->prepare('SELECT date FROM matches WHERE tournament = :tournament AND done = "0" and DATE != "" ORDER BY date ASC LIMIT 1');
$query->bindValue(':tournament', $tournament, PDO::PARAM_STR);
if ( $query->execute() ) {
  $firstPendingString = $query->fetch(PDO::FETCH_ASSOC)['date'];
  echo "first pending: " . $firstPendingString . "\n";
  $firstPending = new DateTime($firstPendingString);
} else {
  echo "error on getting first undone match\n";
}

//obter lista de jogos:
$delta = DateInterval::createFromDateString("2 hour 30 minute");
$firstPending->add($delta);
echo "Now: ". json_encode($now) . "\n\n". "FirstPending: " . json_encode($firstPending) . "\n\n";
if ($now > $firstPending) {
  echo "precisa atualizar!\n";
  $url = "https://www.cbf.com.br/futebol-brasileiro/competicoes/campeonato-brasileiro-" . substr($tournament, 0, 7) . '/' . substr($tournament,8,4);
  $miner = new SiteCBFMiner($url, $tournament);
  $gameList = $miner->atualizaJogos($pdo);
} else {
  $query = $pdo->prepare('SELECT * FROM matches WHERE tournament = :tournament');
  $query->bindValue(':tournament', $tournament, PDO::PARAM_STR);
  if( $query->execute() ){
    $gameList = $query->fetchAll(PDO::FETCH_CLASS);
  } else {
    echo "error\n";
  }
}
//obter lista de escudos:
$query = $pdo->prepare('SELECT DISTINCT matches.homeTeam, badges.url from MATCHES inner join(badges) on matches.homeTeam = badges.team where tournament = :tournament');
$query->bindValue(':tournament', $tournament, PDO::PARAM_STR);
$query->execute();
$badges = [];
foreach( $query as $pair) {
  $badges[$pair['homeTeam']] = $pair['url'];
} 
/*echo json_encode($gameList) . "\n";
echo json_encode($badges) . "\n";*/


?>
