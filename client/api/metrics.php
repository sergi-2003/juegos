<?php
header('Content-Type: application/json; charset=utf-8');

$host = "localhost";
$db   = "u486909604_vitaguard";
$user = "u486909604_vitaguard";
$pass = "3UgAOpe5";
$charset = "utf8mb4";

try {
  $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
  $pdo = new PDO($dsn, $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);

  // Totales (sin user_id)
  $totals = $pdo->query("
    SELECT
      COUNT(*) AS total_games,
      AVG(score) AS avg_score,
      AVG(accuracy_percentage) AS avg_accuracy
    FROM v_game_scores_public
  ")->fetch();

  // Por nivel
  $byLevel = $pdo->query("
    SELECT
      level_type,
      COUNT(*) AS games,
      AVG(score) AS avg_score,
      AVG(time_taken) AS avg_time_taken,
      AVG(accuracy_percentage) AS avg_accuracy
    FROM v_game_scores_public
    GROUP BY level_type
    ORDER BY games DESC
  ")->fetchAll();

  echo json_encode([
    "generated_at" => date('Y-m-d H:i:s'),
    "totals" => $totals,
    "by_level" => $byLevel
  ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode([
    "error" => $e->getMessage()
  ], JSON_UNESCAPED_UNICODE);
}