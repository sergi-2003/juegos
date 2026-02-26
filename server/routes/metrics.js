const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');

// GET /api/metrics
router.get('/', async (req, res) => {
  try {
    // Totales
    const totalsRows = await executeQuery(
      `SELECT
         COUNT(*) AS total_games,
         COUNT(DISTINCT user_id) AS unique_users,
         AVG(score) AS avg_score,
         AVG(accuracy_percentage) AS avg_accuracy
       FROM game_scores`
    );

    // Por nivel
    const byLevelRows = await executeQuery(
      `SELECT
         level_type,
         COUNT(*) AS games,
         AVG(score) AS avg_score,
         AVG(time_taken) AS avg_time_taken,
         AVG(accuracy_percentage) AS avg_accuracy
       FROM game_scores
       GROUP BY level_type
       ORDER BY games DESC`
    );

    return res.json({
      generated_at: new Date().toISOString(),
      totals: totalsRows[0] || {
        total_games: 0,
        unique_users: 0,
        avg_score: 0,
        avg_accuracy: 0
      },
      by_level: byLevelRows || []
    });
  } catch (error) {
    console.error('Error en /api/metrics:', error);
    return res.status(500).json({
      error: 'Error interno',
      message: error.message
    });
  }
});

module.exports = router;