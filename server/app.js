// ============================================
// SERVIDOR PRINCIPAL - VITAGUARD HEROES
// ============================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Importar configuraciones y modelos
const { checkConnection, initializeTables } = require('./config/database');

// Importar rutas
const authRoutes = require('./routes/auth');
const scoreRoutes = require('./routes/scores');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARES
// ============================================

// Helmet para seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:3000", "http://127.0.0.1:3000"],
    },
  },
  crossOriginEmbedderPolicy: false
}));


// Rate limiting general - más permisivo para desarrollo
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX) || 1000, // Aumentado de 100 a 1000
    message: {
        error: 'Demasiadas peticiones',
        message: 'Por favor, intenta nuevamente más tarde'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Saltar rate limiting para localhost en desarrollo
        return req.ip === '127.0.0.1' || req.ip === '::1' || req.hostname === 'localhost';
    }
});

app.use(generalLimiter);

// CORS para permitir requests del frontend
const corsOptions = {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
    maxAge: 86400 // 24 horas
};

app.use(cors(corsOptions));

// Parser para JSON y URL encoded
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos del cliente
app.use(express.static(path.join(__dirname, '../client')));

// Middleware de logging
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const userAgent = req.get('User-Agent') || 'Unknown';
    console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip} - UA: ${userAgent.substring(0, 50)}`);
    next();
});

// ============================================
// RUTAS PRINCIPALES
// ============================================

// Ruta principal - servir index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Ruta de estado del servidor
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime()
    });
});

// ============================================
// RUTAS DE API
// ============================================

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Rutas de puntuaciones
app.use('/api/scores', scoreRoutes);

// Información del juego
app.get('/api/game/info', (req, res) => {
    res.json({
        name: 'VitaGuard Heroes',
        version: '1.0.0',
        description: 'Juego educativo sobre prevención del cáncer',
        cancerTypes: [
            {
                id: 'mama',
                name: 'Cáncer de Mama',
                difficulty: 'Básico',
                description: 'Aprende técnicas de autoexploración y la importancia de los chequeos regulares.'
            },
            {
                id: 'prostata',
                name: 'Cáncer de Próstata',
                difficulty: 'Intermedio',
                description: 'Conoce los factores de riesgo y la importancia de los exámenes preventivos.'
            },
            {
                id: 'cervical',
                name: 'Cáncer Cervical',
                difficulty: 'Intermedio',
                description: 'Prevención a través de vacunación y pruebas de detección regulares.'
            },
            {
                id: 'pulmon',
                name: 'Cáncer de Pulmón',
                difficulty: 'Avanzado',
                description: 'Comprende los factores de riesgo y cómo proteger tus pulmones.'
            }
        ]
    });
});

// Estadísticas globales del juego
app.get('/api/game/stats', (req, res) => {
    res.json({
        totalPlayers: 1247,
        gamesPlayed: 5683,
        levelsCompleted: 12901,
        livesEducated: 1247,
        lastUpdated: new Date().toISOString()
    });
});

// Consejos de salud aleatorios
app.get('/api/health/tips', (req, res) => {
    const healthTips = [
        {
            id: 1,
            category: 'Prevención General',
            tip: 'La detección temprana salva vidas. Hazte chequeos regulares.',
            icon: '🔍'
        },
        {
            id: 2,
            category: 'Ejercicio',
            tip: '30 minutos de ejercicio diario reducen el riesgo de cáncer.',
            icon: '🏃‍♂️'
        },
        {
            id: 3,
            category: 'Alimentación',
            tip: 'Una dieta rica en frutas y verduras fortalece tu sistema inmune.',
            icon: '🥗'
        },
        {
            id: 4,
            category: 'Tabaco',
            tip: 'Evita el tabaco. Es la causa principal del cáncer de pulmón.',
            icon: '🚭'
        },
        {
            id: 5,
            category: 'Protección Solar',
            tip: 'Usa protector solar para prevenir el cáncer de piel.',
            icon: '☀️'
        },
        {
            id: 6,
            category: 'Autoexamen',
            tip: 'Conoce tu cuerpo. Los autoexámenes detectan cambios importantes.',
            icon: '🔍'
        }
    ];
    
    // Devolver un tip aleatorio o todos
    const random = req.query.random === 'true';
    if (random) {
        const randomTip = healthTips[Math.floor(Math.random() * healthTips.length)];
        res.json(randomTip);
    } else {
        res.json(healthTips);
    }
});

// Información detallada sobre tipos de cáncer
app.get('/api/cancer/:type', (req, res) => {
    const cancerInfo = {
        mama: {
            name: 'Cáncer de Mama',
            overview: 'El cáncer de mama es el segundo tipo de cáncer más común en mujeres.',
            statistics: {
                incidence: '1 de cada 8 mujeres',
                survivalRate: '99% con detección temprana',
                averageAge: '62 años'
            },
            riskFactors: [
                'Edad avanzada',
                'Historial familiar',
                'Mutaciones genéticas (BRCA1, BRCA2)',
                'Exposición a estrógenos',
                'Obesidad',
                'Consumo de alcohol'
            ],
            symptoms: [
                'Bulto en la mama o axila',
                'Cambios en el tamaño o forma de la mama',
                'Cambios en la piel de la mama',
                'Secreción del pezón',
                'Dolor en la mama'
            ],
            prevention: [
                'Autoexámenes mensuales',
                'Mamografías regulares',
                'Mantener peso saludable',
                'Ejercicio regular',
                'Limitar alcohol',
                'Evitar terapia hormonal prolongada'
            ],
            earlyDetection: [
                'Autoexamen mensual después de la menstruación',
                'Examen clínico anual',
                'Mamografía anual después de los 40-50 años',
                'Resonancia magnética en casos de alto riesgo'
            ]
        },
        prostata: {
            name: 'Cáncer de Próstata',
            overview: 'Es el segundo cáncer más común en hombres después del cáncer de piel.',
            statistics: {
                incidence: '1 de cada 9 hombres',
                survivalRate: '98% con detección temprana',
                averageAge: '66 años'
            },
            riskFactors: [
                'Edad (mayor a 50 años)',
                'Raza (mayor incidencia en afroamericanos)',
                'Historial familiar',
                'Obesidad',
                'Dieta alta en grasas'
            ],
            symptoms: [
                'Dificultad para orinar',
                'Flujo urinario débil',
                'Sangre en la orina',
                'Dolor en caderas o espalda',
                'Disfunción eréctil'
            ],
            prevention: [
                'Dieta rica en frutas y verduras',
                'Ejercicio regular',
                'Mantener peso saludable',
                'Limitar grasas saturadas',
                'Considerar suplementos de licopeno'
            ],
            earlyDetection: [
                'Examen rectal digital anual después de los 50',
                'Prueba PSA anual',
                'Discutir riesgos con el médico',
                'Exámenes más tempranos si hay alto riesgo'
            ]
        },
        cervical: {
            name: 'Cáncer Cervical',
            overview: 'Causado principalmente por el virus del papiloma humano (VPH).',
            statistics: {
                incidence: '13,800 casos nuevos anuales en EE.UU.',
                survivalRate: '92% con detección temprana',
                averageAge: '50 años'
            },
            riskFactors: [
                'Infección por VPH',
                'Múltiples parejas sexuales',
                'Inicio temprano de actividad sexual',
                'Otras infecciones de transmisión sexual',
                'Sistema inmune debilitado',
                'Fumar'
            ],
            symptoms: [
                'Sangrado vaginal anormal',
                'Sangrado después del coito',
                'Secreción vaginal inusual',
                'Dolor pélvico',
                'Dolor durante el coito'
            ],
            prevention: [
                'Vacunación contra VPH',
                'Práctica de sexo seguro',
                'Limitar número de parejas sexuales',
                'No fumar',
                'Citologías regulares'
            ],
            earlyDetection: [
                'Citología (Papanicolaou) cada 3 años',
                'Prueba de VPH cada 5 años',
                'Combinación de ambas cada 5 años',
                'Seguimiento de resultados anormales'
            ]
        },
        pulmon: {
            name: 'Cáncer de Pulmón',
            overview: 'Es la principal causa de muerte por cáncer en el mundo.',
            statistics: {
                incidence: '228,820 casos nuevos anuales en EE.UU.',
                survivalRate: '21% promedio, 56% con detección temprana',
                averageAge: '70 años'
            },
            riskFactors: [
                'Fumar (85% de los casos)',
                'Humo de segunda mano',
                'Exposición al radón',
                'Exposición al asbesto',
                'Contaminación del aire',
                'Historial familiar'
            ],
            symptoms: [
                'Tos persistente',
                'Tos con sangre',
                'Dificultad para respirar',
                'Dolor en el pecho',
                'Ronquera',
                'Pérdida de peso inexplicable'
            ],
            prevention: [
                'No fumar o dejar de fumar',
                'Evitar humo de segunda mano',
                'Probar radón en el hogar',
                'Evitar carcinógenos ocupacionales',
                'Dieta rica en frutas y verduras',
                'Ejercicio regular'
            ],
            earlyDetection: [
                'Tomografía computarizada de baja dosis',
                'Radiografía de tórax anual',
                'Espirometría para fumadores',
                'Consulta médica ante síntomas'
            ]
        }
    };
    
    const type = req.params.type;
    const info = cancerInfo[type];
    
    if (!info) {
        return res.status(404).json({
            error: 'Tipo de cáncer no encontrado',
            availableTypes: Object.keys(cancerInfo)
        });
    }
    
    res.json(info);
});

// Recursos educativos
app.get('/api/resources', (req, res) => {
    res.json({
        organizations: [
            {
                name: 'American Cancer Society',
                url: 'https://www.cancer.org',
                description: 'Información completa sobre prevención y tratamiento del cáncer',
                language: 'en'
            },
            {
                name: 'Instituto Nacional del Cáncer',
                url: 'https://www.cancer.gov/espanol',
                description: 'Recursos en español sobre investigación y tratamiento',
                language: 'es'
            },
            {
                name: 'World Health Organization - Cancer',
                url: 'https://www.who.int/health-topics/cancer',
                description: 'Estadísticas globales y guías de prevención',
                language: 'en'
            }
        ],
        hotlines: [
            {
                name: 'Línea de Información sobre el Cáncer',
                phone: '1-800-4-CANCER',
                hours: '24/7',
                language: 'es/en'
            },
            {
                name: 'Red Nacional de Apoyo contra el Cáncer',
                phone: '1-800-ACS-2345',
                hours: '24/7',
                language: 'es/en'
            }
        ],
        selfExamGuides: [
            {
                type: 'mama',
                title: 'Guía de Autoexamen de Mama',
                description: 'Instrucciones paso a paso para el autoexamen mensual',
                downloadUrl: '/resources/guides/breast-self-exam-es.pdf'
            },
            {
                type: 'prostata',
                title: 'Síntomas de Alerta - Próstata',
                description: 'Signos importantes que no debes ignorar',
                downloadUrl: '/resources/guides/prostate-symptoms-es.pdf'
            }
        ]
    });
});

// ============================================
// MANEJO DE ERRORES
// ============================================

// Middleware para rutas no encontradas
app.use((req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        message: 'La ruta solicitada no existe en este servidor.',
        availableRoutes: [
            'GET /',
            'GET /api/health',
            'GET /api/game/info',
            'GET /api/game/stats',
            'GET /api/health/tips',
            'GET /api/cancer/:type',
            'GET /api/resources'
        ]
    });
});

// Middleware para manejo de errores
app.use((err, req, res, next) => {
    console.error('Error del servidor:', err.stack);
    
    res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Ha ocurrido un error inesperado.',
        timestamp: new Date().toISOString()
    });
});

// ============================================
// INICIALIZACIÓN DEL SERVIDOR
// ============================================

// Función para inicializar la base de datos
const initializeDatabase = async () => {
    console.log('🔄 Verificando conexión a la base de datos...');
    
    const dbConnected = await checkConnection();
    if (!dbConnected) {
        console.error('❌ No se pudo conectar a la base de datos MySQL');
        console.log('💡 Asegúrate de que MySQL esté ejecutándose y las credenciales sean correctas');
        console.log('📋 Revisa el archivo .env para configurar la conexión');
        console.log('⚠️  CONTINUANDO SIN BASE DE DATOS - Funcionalidad limitada');
        return false; // No salir del proceso, solo retornar false
    }
    
    const tablesInitialized = await initializeTables();
    if (!tablesInitialized) {
        console.error('❌ No se pudieron inicializar las tablas');
        console.log('⚠️  CONTINUANDO SIN BASE DE DATOS - Funcionalidad limitada');
        return false; // No salir del proceso
    }
    
    return true;
};

app.listen(PORT, async () => {
    console.log('🦸‍♂️ ===============================================');
    console.log('🏥    VITAGUARD HEROES - SERVIDOR INICIADO    🏥');
    console.log('🦸‍♀️ ===============================================');
    console.log(`🌐 Servidor ejecutándose en: http://localhost:${PORT}`);
    console.log(`📁 Sirviendo archivos desde: ${path.join(__dirname, '../client')}`);
    console.log(`🕐 Iniciado en: ${new Date().toLocaleString()}`);
    console.log('💡 Misión: Educar sobre la prevención del cáncer');
    console.log('📊 Estado: http://localhost:' + PORT + '/api/health');
    console.log('🎮 Juego: http://localhost:' + PORT);
    console.log('===============================================');
    
    // Inicializar base de datos
    const dbInitialized = await initializeDatabase();
    
    if (dbInitialized) {
        console.log('✅ Conexión exitosa a MySQL');
        console.log('✅ Tablas inicializadas correctamente');
    } else {
        console.log('⚠️  MODO SIN BASE DE DATOS - Solo frontend disponible');
        console.log('🎮 El juego funcionará sin registro/login persistente');
    }
    
    // Mostrar rutas disponibles
    console.log('\n📋 RUTAS DISPONIBLES:');
    console.log('   🏠 GET /                      - Página principal');
    console.log('   💚 GET /api/health            - Estado del servidor');
    console.log('   🎮 GET /api/game/info         - Información del juego');
    console.log('   📊 GET /api/game/stats        - Estadísticas globales');
    console.log('   💡 GET /api/health/tips       - Consejos de salud');
    console.log('   🩺 GET /api/cancer/:type      - Info sobre tipos de cáncer');
    console.log('   📚 GET /api/resources         - Recursos educativos');
    console.log('\n🔐 RUTAS DE AUTENTICACIÓN:');
    console.log('   📝 POST /api/auth/register    - Registro de usuario');
    console.log('   🔑 POST /api/auth/login       - Inicio de sesión');
    console.log('   🔄 POST /api/auth/refresh     - Renovar token');
    console.log('   ✅ GET /api/auth/verify       - Verificar token');
    console.log('   🚪 POST /api/auth/logout      - Cerrar sesión');
    console.log('   👤 GET /api/auth/profile      - Perfil del usuario');
    console.log('\n🏆 RUTAS DE PUNTUACIONES:');
    console.log('   📈 POST /api/scores/submit    - Enviar puntuación');
    console.log('   🥇 GET /api/scores/leaderboard - Ranking global');
    console.log('   👤 GET /api/scores/user       - Puntuaciones del usuario');
    console.log('   🎯 GET /api/scores/best/:level - Mejor puntuación en nivel');
    console.log('   📊 GET /api/scores/stats      - Estadísticas generales');
    console.log('   🔄 GET /api/scores/activity   - Actividad reciente');
    console.log('\n🚀 ¡Servidor listo para salvar vidas!');
    console.log('🔒 Sistema de autenticación JWT habilitado');
    console.log('🏆 Sistema de puntuaciones y ranking activo');
    console.log('🛡️  Seguridad y rate limiting configurados');
});

// Manejo graceful de cierre del servidor
process.on('SIGTERM', () => {
    console.log('\n🛑 Cerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando servidor...');
    process.exit(0);
});

module.exports = app;