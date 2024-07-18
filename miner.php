<?php
require_once 'miners.php';


$ano = 2024;
$url_base = "https://www.cbf.com.br/futebol-brasileiro/competicoes/campeonato-brasileiro-serie-";
while ($ano >= 2020) {
  $miner = new SiteCBFMiner( $url_base."a"."/".$ano, "serie-a-".$ano);
  $miner->cadastraEscudos("db");
  $miner = new SiteCBFMiner( $url_base."b"."/".$ano, "serie-b-".$ano);
  $miner->cadastraEscudos("db");
  $miner = new SiteCBFMultifase( $url_base."c"."/".$ano, "serie-c-".$ano);
  $miner->cadastraEscudos("db");
  $miner = new SiteCBFMultifase( $url_base."d"."/".$ano, "serie-d-".$ano);
  $miner->cadastraEscudos("db");
  //$miner = new SiteCBFMultifase( "https://www.cbf.com.br/futebol-brasileiro/competicoes/copa-brasil-masculino"."/".$ano, "copa-do-brasil-".$ano);
  //$miner->cadastraEscudos("db");
  $ano--;

}

?>

