<?php

function get_sofascore_round($unique_tournament, $season, $round){
    $url = "https://api.sofascore.com/api/v1/unique-tournament/{$unique_tournament}/season/{$season}/events/round/{$round}";

    echo $url;
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);

    echo $response;
    return $response;
}


$ut = $_GET['ut']??325;
$season = $_GET['season']??72034;
$round = $_GET['round']??3;

$res = get_sofascore_round($ut, $season, $round);
echo $res;
?>
