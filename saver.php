<?php
// Connect to SQLite3 database
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$db = new PDO('sqlite:megaranking.db');

// Get the raw input data
$inputData = file_get_contents("php://input");
$data = json_decode($inputData, true);
$event = json_decode(urldecode($_GET['event']));

$stmt = $db->prepare("INSERT OR REPLACE INTO events (
  id, 
  tournament_id, 
  tournament_name,
  season_id,
  season_name,
  round,
  status_code,
  home_team_id,
  home_team_name,
  home_score,
  away_team_id,
  away_team_name,
  away_score,
  timestamp
  ) 
      
  VALUES (:id, :tournament_id, :tournament_name, :season_id, :season_name, :round, :status_code, :home_team_id, :home_team_name, :home_score, :away_team_id, :away_team_name, :away_score, :timestamp)");
$stmt->bindValue(':timestamp', $event->timestamp, PDO::PARAM_STR);
$stmt->bindValue(':away_score', $event->away_score, PDO::PARAM_INT);
$stmt->bindValue(':away_team_name', $event->away_team_name, PDO::PARAM_STR);
$stmt->bindValue(':away_team_id', $event->away_team_id, PDO::PARAM_INT);
$stmt->bindValue(':home_score', $event->home_score, PDO::PARAM_INT);
$stmt->bindValue(':home_team_name', $event->home_team_name, PDO::PARAM_STR);
$stmt->bindValue(':home_team_id', $event->home_team_id, PDO::PARAM_INT);
$stmt->bindValue(':id', $event->id, PDO::PARAM_INT);
$stmt->bindValue(':status_code', $event->status_code, PDO::PARAM_INT);
$stmt->bindValue(':round', $event->round, PDO::PARAM_INT);
$stmt->bindValue(':season_name', $event->season_name, PDO::PARAM_STR);
$stmt->bindValue(':season_id', $event->season_id, PDO::PARAM_INT);
$stmt->bindValue(':tournament_name', $event->tournament_name, PDO::PARAM_STR);
$stmt->bindValue(':tournament_id', $event->tournament_id, PDO::PARAM_INT);
$stmt->execute();
// Return a response
echo json_encode(["status" => "success", "body" => $data]);
