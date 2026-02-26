// ============================================
// RUTAS DE PUNTUACIONES Y RANKING
// ============================================

const express = require('express');
const { body, validationResult } = require('express-validator');
const GameScore = require('../models/GameScore');
const User = require('../models/User');
const { authenticateToken, optionalAuth } = require('../config/auth');

const router = express.Router();

// Validaciones para enviar puntuación
const scoreValidation = [
    body('level_type')
        .isIn(['mama', 'prostata', 'cervical', 'colon'])
        .withMessage('Tipo de nivel inválido'),
    body('score')
        .isInt({ min: 0, max: 100000 })
        .withMessage('Puntuación debe ser un número entre 0 y 100000'),
    body('time_taken')
        .isInt({ min: 1, max: 3600 })
        .withMessage('Tiempo debe ser entre 1 segundo y 1 hora'),
    body('anomalies_found')
        .isInt({ min: 0, max: 50 })
        .withMessage('Anomalías encontradas debe ser un número entre 0 y 50'),
    body('total_anomalies')
        .isInt({ min: 1, max: 50 })
        .withMessage('Total de anomalías debe ser un número entre 1 y 50')
];

// ============================================
// ENVIAR PUNTUACIÓN
// ============================================
router.post('/submit', authenticateToken, scoreValidation, async (req, res) => {
    try {
        console.log('\n🎮 ===== NUEVA PUNTUACIÓN RECIBIDA =====');
        console.log('📅 Timestamp:', new Date().toISOString());
        console.log('👤 Usuario ID:', req.user.id);
        console.log('📊 Datos recibidos:', req.body);
        
        // Verificar validaciones
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('❌ Errores de validación:', errors.array());
            return res.status(400).json({
                error: 'Datos inválidos',
                message: 'Por favor, verifica los datos de la puntuación',
                details: errors.array()
            });
        }

        const { level_type, score, time_taken, anomalies_found, total_anomalies } = req.body;

        // Validar que anomalies_found no sea mayor que total_anomalies
        if (anomalies_found > total_anomalies) {
            console.log('❌ Datos inconsistentes: anomalies_found > total_anomalies');
            return res.status(400).json({
                error: 'Datos inconsistentes',
                message: 'Las anomalías encontradas no pueden ser más que el total'
            });
        }

        console.log('✅ Validaciones pasadas, creando puntuación...');

        // Crear puntuación
        const gameScore = await GameScore.create({
            user_id: req.user.id,
            level_type,
            score,
            time_taken,
            anomalies_found,
            total_anomalies
        });

        console.log('✅ Puntuación creada:', gameScore);

        console.log(`🎮 Puntuación creada para usuario ${req.user.id}: ${score} puntos en nivel ${level_type}`);

        // Actualizar estadísticas del usuario
        const user = await User.findById(req.user.id);
        console.log(`👤 Usuario encontrado: ${user.username}, Score actual: ${user.total_score}`);
        
        const levelCompleted = anomalies_found === total_anomalies;
        console.log(`🎯 Level completado: ${levelCompleted} (${anomalies_found}/${total_anomalies})`);
        
        // Actualizar estadísticas del usuario usando el método estático
        console.log(`📈 Actualizando estadísticas del usuario ${user.id}...`);
        await User.updateUserStats(req.user.id, score, levelCompleted);

        // Obtener el usuario actualizado de la base de datos
        const updatedUser = await User.findById(req.user.id);
        console.log(`🔄 Usuario actualizado: Score final: ${updatedUser.total_score}`);

        // Obtener ranking del usuario en este nivel
        const ranking = await GameScore.getUserRankingInLevel(req.user.id, level_type);

        // Verificar si es un nuevo récord personal
        const bestScore = await GameScore.getBestUserScore(req.user.id, level_type);
        const isNewRecord = !bestScore || score > bestScore.score;

        res.status(201).json({
            message: 'Puntuación guardada exitosamente',
            score: gameScore,
            stats: {
                ranking,
                isNewRecord,
                levelCompleted,
                accuracy: gameScore.accuracy_percentage
            },
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                full_name: updatedUser.full_name,
                total_score: updatedUser.total_score,
                games_played: updatedUser.games_played,
                levels_completed: updatedUser.levels_completed
            }
        });

    } catch (error) {
        console.error('Error al guardar puntuación:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo guardar la puntuación'
        });
    }
});

// ============================================
// OBTENER RANKING GLOBAL
// ============================================
router.get('/leaderboard', optionalAuth, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const level_type = req.query.level_type;

        let scores;
        if (level_type && ['mama', 'prostata', 'cervical', 'colon'].includes(level_type)) {
            scores = await GameScore.getByLevel(level_type, limit);
        } else {
            // Usar el nuevo método para el leaderboard global
            scores = await GameScore.getGlobalLeaderboard(limit);
        }

        // Si hay usuario autenticado, obtener su posición
        let userRanking = null;
        if (req.user) {
            if (level_type) {
                userRanking = await GameScore.getUserRankingInLevel(req.user.id, level_type);
            } else {
                const user = await User.findById(req.user.id);
                userRanking = await user.getRanking();
            }
        }

        res.json({
            leaderboard: scores,
            filter: level_type || 'global',
            userRanking,
            total: scores.length
        });

    } catch (error) {
        console.error('Error al obtener ranking:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo obtener el ranking'
        });
    }
});

// ============================================
// OBTENER PUNTUACIONES DEL USUARIO
// ============================================
router.get('/user/:userId?', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.userId || req.user.id;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);

        // Si solicita puntuaciones de otro usuario, verificar que existe
        if (userId !== req.user.id) {
            const targetUser = await User.findById(userId);
            if (!targetUser) {
                return res.status(404).json({
                    error: 'Usuario no encontrado',
                    message: 'El usuario solicitado no existe'
                });
            }
        }

        const scores = await GameScore.getByUser(userId, limit);
        const stats = await GameScore.getUserStats(userId);

        res.json({
            scores,
            stats,
            userId
        });

    } catch (error) {
        console.error('Error al obtener puntuaciones del usuario:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudieron obtener las puntuaciones'
        });
    }
});

// ============================================
// OBTENER MEJOR PUNTUACIÓN EN UN NIVEL
// ============================================
router.get('/best/:level_type', authenticateToken, async (req, res) => {
    try {
        const { level_type } = req.params;

        if (!['mama', 'prostata', 'cervical', 'colon'].includes(level_type)) {
            return res.status(400).json({
                error: 'Tipo de nivel inválido',
                message: 'Los tipos válidos son: mama, prostata, cervical, colon'
            });
        }

        const bestScore = await GameScore.getBestUserScore(req.user.id, level_type);
        const ranking = await GameScore.getUserRankingInLevel(req.user.id, level_type);

        res.json({
            bestScore,
            ranking,
            level_type
        });

    } catch (error) {
        console.error('Error al obtener mejor puntuación:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo obtener la mejor puntuación'
        });
    }
});

// ============================================
// OBTENER ESTADÍSTICAS GENERALES
// ============================================
router.get('/stats', async (req, res) => {
    try {
        const generalStats = await GameScore.getGeneralStats();
        const topUsers = await User.getTopUsers(10);
        const recentActivity = await GameScore.getRecentActivity(10);

        res.json({
            general: generalStats,
            topUsers,
            recentActivity,
            lastUpdated: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudieron obtener las estadísticas'
        });
    }
});

// ============================================
// OBTENER ACTIVIDAD RECIENTE
// ============================================
router.get('/activity', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const activity = await GameScore.getRecentActivity(limit);

        res.json({
            activity,
            total: activity.length,
            lastUpdated: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error al obtener actividad:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo obtener la actividad reciente'
        });
    }
});

// ============================================
// COMPARAR PUNTUACIONES CON AMIGOS
// ============================================
router.get('/compare/:friendId', authenticateToken, async (req, res) => {
    try {
        const { friendId } = req.params;

        // Verificar que el amigo existe
        const friend = await User.findById(friendId);
        if (!friend) {
            return res.status(404).json({
                error: 'Usuario no encontrado',
                message: 'El usuario con el que quieres compararte no existe'
            });
        }

        // Obtener estadísticas de ambos usuarios
        const userStats = await GameScore.getUserStats(req.user.id);
        const friendStats = await GameScore.getUserStats(friendId);

        // Obtener información básica de ambos usuarios
        const user = await User.findById(req.user.id);

        res.json({
            comparison: {
                user: {
                    info: user.toJSON(),
                    stats: userStats
                },
                friend: {
                    info: friend.toJSON(),
                    stats: friendStats
                }
            }
        });

    } catch (error) {
        console.error('Error al comparar puntuaciones:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo realizar la comparación'
        });
    }
});

module.exports = router;