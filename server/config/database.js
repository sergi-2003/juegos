require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'srv1926.hstgr.io',
    port: 3306,
    user: 'u486909604_vitaguard',
    password: '?3UgAOpe5',
    database: 'u486909604_vitaguard',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let pool = null;

const checkConnection = async () => {
    try {
        console.log('🔄 Conectando a MySQL (Railway)...');
        console.log('🔧 Host:', dbConfig.host);
        console.log('🔧 Port:', dbConfig.port);
        console.log('🔧 User:', dbConfig.user);
        console.log('🔧 Database:', dbConfig.database);
        
        pool = mysql.createPool(dbConfig);
        const connection = await pool.getConnection();
        
        // Solo conectar, no crear nada - usar base de datos existente
        connection.release();
        console.log('✅ Conexión exitosa a MySQL (Railway)');
        return true;
        
    } catch (error) {
        console.log('❌ Error conectando a MySQL:', error.code, error.errno, error.message);
        console.log('⚠️  CONTINUANDO SIN BASE DE DATOS');
        return false;
    }
};

const initializeTables = async () => {
    if (!pool) {
        console.log('⚠️  No hay conexión a base de datos');
        return false;
    }
    
    // No crear tablas - usar las que ya existen
    console.log('✅ Usando tablas existentes en Railway');
    return true;
};

const executeQuery = async (query, params = []) => {
    if (!pool) {
        throw new Error('No hay conexión a la base de datos');
    }
    
    try {
        const connection = await pool.getConnection();
        const [results] = await connection.execute(query, params);
        connection.release();
        return results;
    } catch (error) {
        console.error('❌ Error en query:', error.message);
        throw error;
    }
};

module.exports = {
    checkConnection,
    initializeTables,
    executeQuery
};