<?php
require_once 'miners.php';

$ano = 2024;
$url_base = 'https://www.cbf.com.br/futebol-brasileiro/competicoes/campeonato-brasileiro-serie-';
try {
    $db = new PDO('sqlite:matches.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $res = $db->exec('CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament TEXT,
    number INTEGER,
    homeTeam TEXT,
    awayTeam TEXT,
    homeScore TEXT,
    awayScore TEXT,
    date TEXT,
    done BOOLEAN)');   
    echo "Res: ". $res;
    while ($ano >= 2020) {
        $miner = new SiteCBFMiner($url_base . 'a' . '/' . $ano, 'serie-a-' . $ano);
        $miner->cadastraJogos($db);
        $miner->cadastraEscudos($db);
        $miner = new SiteCBFMiner($url_base . 'b' . '/' . $ano, 'serie-b-' . $ano);
        $miner->cadastraJogos($db);
        $miner->cadastraEscudos($db);
        $miner = new SiteCBFMultifase($url_base . 'c' . '/' . $ano, 'serie-c-' . $ano);
        $miner->cadastraJogos($db);
        $miner->cadastraEscudos($db);
        $miner = new SiteCBFMultifase($url_base . 'd' . '/' . $ano, 'serie-d-' . $ano);
        $miner->cadastraJogos($db);
        $miner->cadastraEscudos($db);
        // $miner = new SiteCBFMultifase( "https://www.cbf.com.br/futebol-brasileiro/competicoes/copa-brasil-masculino"."/".$ano, "copa-do-brasil-".$ano);
        // $miner->cadastraEscudos("db");
        $ano--;
    }
}
 catch (PDOException $e) {
    echo $e->getMessage()."<br>\n";
}
    
while ($ano >= 2020) {
    $miner = new SiteCBFMiner($url_base . 'a' . '/' . $ano, 'serie-a-' . $ano);
    $miner->cadastraJogos($db);
    $miner->cadastraEscudos($db);
    $miner = new SiteCBFMiner($url_base . 'b' . '/' . $ano, 'serie-b-' . $ano);
    $miner->cadastraJogos($db);
    $miner->cadastraEscudos($db);
    $miner = new SiteCBFMultifase($url_base . 'c' . '/' . $ano, 'serie-c-' . $ano);
    $miner->cadastraJogos($db);
    $miner->cadastraEscudos($db);
    $miner = new SiteCBFMultifase($url_base . 'd' . '/' . $ano, 'serie-d-' . $ano);
    $miner->cadastraJogos($db);
    $miner->cadastraEscudos($db);
    // $miner = new SiteCBFMultifase( "https://www.cbf.com.br/futebol-brasileiro/competicoes/copa-brasil-masculino"."/".$ano, "copa-do-brasil-".$ano);
    // $miner->cadastraEscudos("db");
    $ano--;
}
}
?>

