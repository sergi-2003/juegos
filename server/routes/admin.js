// routes/admin.js
const express = require('express');
const ExcelJS = require('exceljs');

const { authenticateToken } = require('../config/auth');
const requireAdmin = require('../middleware/requireAdmin');
const { executeQuery } = require('../config/database');

const router = express.Router();

// ✅ MÉTRICAS SOLO ADMIN (users + game_scores)
router.get('/metrics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Totales desde users
    const users = await executeQuery(`
      SELECT
        COUNT(*) AS total_users,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS admins
      FROM users
    `);

    // Totales desde game_scores
    const games = await executeQuery(`
      SELECT
        COUNT(*) AS total_games,
        ROUND(AVG(score), 2) AS avg_score,
        ROUND(AVG(time_taken), 2) AS avg_time,
        ROUND(AVG(accuracy_percentage), 2) AS avg_accuracy
      FROM game_scores
    `);

    // Top jugadores (sumatoria real desde game_scores)
    const topPlayers = await executeQuery(`
      SELECT
        u.id,
        u.username,
        u.email,
        u.role,
        COALESCE(SUM(gs.score), 0) AS total_score,
        COUNT(gs.id) AS games_played
      FROM users u
      LEFT JOIN game_scores gs ON gs.user_id = u.id
      GROUP BY u.id
      ORDER BY total_score DESC
      LIMIT 10
    `);

    // Resumen por nivel
    const byLevel = await executeQuery(`
      SELECT
        level_type,
        COUNT(*) AS games,
        ROUND(AVG(score), 2) AS avg_score,
        ROUND(AVG(time_taken), 2) AS avg_time_taken,
        ROUND(AVG(accuracy_percentage), 2) AS avg_accuracy
      FROM game_scores
      GROUP BY level_type
      ORDER BY games DESC
    `);

    res.json({
      generated_at: new Date().toISOString(),
      totals: {
        total_users: users?.[0]?.total_users ?? 0,
        active_users: users?.[0]?.active_users ?? 0,
        admins: users?.[0]?.admins ?? 0,
        total_games: games?.[0]?.total_games ?? 0,
        avg_score: Number(games?.[0]?.avg_score ?? 0),
        avg_time: Number(games?.[0]?.avg_time ?? 0),
        avg_accuracy: Number(games?.[0]?.avg_accuracy ?? 0),
      },
      top_players: topPlayers || [],
      by_level: byLevel || []
    });
  } catch (err) {
    console.error('Error en /api/admin/metrics:', err);
    res.status(500).json({ error: 'Error interno', message: err.message });
  }
});

// ✅ EXPORT EXCEL (ADMIN)
router.get('/metrics/export', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Reutiliza las mismas queries para mantener consistencia con /metrics
    const users = await executeQuery(`
      SELECT
        COUNT(*) AS total_users,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS admins
      FROM users
    `);

    const games = await executeQuery(`
      SELECT
        COUNT(*) AS total_games,
        ROUND(AVG(score), 2) AS avg_score,
        ROUND(AVG(time_taken), 2) AS avg_time,
        ROUND(AVG(accuracy_percentage), 2) AS avg_accuracy
      FROM game_scores
    `);

    const topPlayers = await executeQuery(`
      SELECT
        u.id,
        u.username,
        u.role,
        COALESCE(SUM(gs.score), 0) AS total_score,
        COUNT(gs.id) AS games_played
      FROM users u
      LEFT JOIN game_scores gs ON gs.user_id = u.id
      GROUP BY u.id
      ORDER BY total_score DESC
      LIMIT 10
    `);

    const byLevel = await executeQuery(`
      SELECT
        level_type,
        COUNT(*) AS games,
        ROUND(AVG(score), 2) AS avg_score,
        ROUND(AVG(time_taken), 2) AS avg_time_taken,
        ROUND(AVG(accuracy_percentage), 2) AS avg_accuracy
      FROM game_scores
      GROUP BY level_type
      ORDER BY games DESC
    `);

    const generatedAt = new Date().toISOString();

    // ---- Excel
    const wb = new ExcelJS.Workbook();
    wb.creator = 'VitaGuard Heroes';
    wb.created = new Date();

    // Hoja 1: Resumen
    const ws1 = wb.addWorksheet('Resumen');
    ws1.columns = [
      { header: 'Métrica', key: 'k', width: 28 },
      { header: 'Valor', key: 'v', width: 18 },
    ];
    ws1.getRow(1).font = { bold: true };

    ws1.addRows([
      { k: 'Usuarios totales', v: users?.[0]?.total_users ?? 0 },
      { k: 'Usuarios activos', v: users?.[0]?.active_users ?? 0 },
      { k: 'Admins', v: users?.[0]?.admins ?? 0 },
      { k: 'Partidas totales', v: games?.[0]?.total_games ?? 0 },
      { k: 'Puntaje promedio', v: Number(games?.[0]?.avg_score ?? 0).toFixed(2) },
      { k: 'Tiempo promedio (s)', v: Number(games?.[0]?.avg_time ?? 0).toFixed(2) },
      { k: 'Precisión promedio (%)', v: Number(games?.[0]?.avg_accuracy ?? 0).toFixed(2) },
      { k: 'Generado en', v: generatedAt },
    ]);

    // Hoja 2: TopJugadores
    const ws2 = wb.addWorksheet('TopJugadores');
    ws2.columns = [
      { header: '#', key: 'rank', width: 6 },
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Usuario', key: 'username', width: 20 },
      { header: 'Rol', key: 'role', width: 10 },
      { header: 'Partidas', key: 'games_played', width: 10 },
      { header: 'Puntaje total', key: 'total_score', width: 14 },
    ];
    ws2.getRow(1).font = { bold: true };

    (topPlayers || []).forEach((p, i) => {
      ws2.addRow({
        rank: i + 1,
        id: p.id,
        username: p.username ?? '',
        role: p.role ?? '',
        games_played: p.games_played ?? 0,
        total_score: p.total_score ?? 0,
      });
    });

    // Hoja 3: PorNivel
    const ws3 = wb.addWorksheet('PorNivel');
    ws3.columns = [
      { header: 'Nivel', key: 'level_type', width: 14 },
      { header: 'Partidas', key: 'games', width: 10 },
      { header: 'Puntaje prom.', key: 'avg_score', width: 14 },
      { header: 'Tiempo prom. (s)', key: 'avg_time_taken', width: 16 },
      { header: 'Precisión prom. (%)', key: 'avg_accuracy', width: 18 },
    ];
    ws3.getRow(1).font = { bold: true };

    (byLevel || []).forEach(r => {
      ws3.addRow({
        level_type: r.level_type,
        games: r.games ?? 0,
        avg_score: Number(r.avg_score ?? 0).toFixed(2),
        avg_time_taken: Number(r.avg_time_taken ?? 0).toFixed(2),
        avg_accuracy: Number(r.avg_accuracy ?? 0).toFixed(2),
      });
    });

    // Descargar
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="vitaguard_admin_metrics_${Date.now()}.xlsx"`
    );

    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Excel export error:', err);
    res.status(500).json({ error: 'No se pudo exportar a Excel' });
  }
});

module.exports = router;