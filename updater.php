<?php
require_once 'miners.php';

$today = new DateTime("now");
echo $today->format("Y-m-d H:i") . "\n";

$db = new PDO('sqlite:db');
$response = $db->query("SELECT date from MATCHES where done = '0' order by DATE asc limit 1");
foreach ($response as $row) {
   print($row['date']);
}

$url_base = "https://www.cbf.com.br/futebol-brasileiro/competicoes/campeonato-brasileiro-serie-";
$ano = 2024;
$miner = new SiteCBFMiner( $url_base."a"."/".$ano, "serie-a-".$ano);
$miner->atualizaJogos("db");
 

?>

