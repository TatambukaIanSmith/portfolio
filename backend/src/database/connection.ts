import mysql from 'mysql2/promise';
import { logger } from '../utils/logger';

let pool: mysql.Pool | null = null;

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  connectionLimit: number;
  multipleStatements?: boolean;
}

export function createDatabaseConfig(): DatabaseConfig {
  // Ensure environment variables are loaded
  const config = {
    host: process.env['DB_HOST'] || 'localhost',
    port: parseInt(process.env['DB_PORT'] || '3306', 10),
    database: process.env['DB_NAME'] || 'iansmith_portfolio',
    user: process.env['DB_USER'] || 'root',
    password: process.env['DB_PASSWORD'] || '',
    connectionLimit: 20,
    multipleStatements: false,
  };

  // Validate required fields
  if (!config.database) {
    throw new Error('DB_NAME environment variable is required');
  }

  return config;
}

export async function connectDatabase(): Promise<mysql.Pool> {
  if (pool) {
    return pool;
  }

  try {
    const config = createDatabaseConfig();
    
    logger.info('🔄 Connecting to MySQL database...', {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
    });

    // Create connection pool (MariaDB compatible)
    pool = mysql.createPool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      connectionLimit: config.connectionLimit,
      charset: 'utf8mb4',
      timezone: 'Z',
      supportBigNumbers: true,
      bigNumberStrings: true,
    });

    // Test the connection
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute('SELECT 1 as test, NOW() as server_time');
      logger.debug('Database test query result:', rows);
    } finally {
      connection.release();
    }

    logger.info('✅ MySQL Database connected successfully');
    logger.info(`📊 Database: ${config.database} on ${config.host}:${config.port}`);
    
    // Handle pool events
    pool.on('connection', (connection) => {
      logger.debug(`New MySQL connection established as id ${connection.threadId}`);
    });

    pool.on('acquire', (connection) => {
      logger.debug(`Connection ${connection.threadId} acquired`);
    });

    pool.on('release', (connection) => {
      logger.debug(`Connection ${connection.threadId} released`);
    });

    return pool;
  } catch (error) {
    logger.error('❌ Failed to connect to MySQL database:', {
      error: error instanceof Error ? error.message : error,
      code: (error as any)?.code,
      errno: (error as any)?.errno,
      sqlState: (error as any)?.sqlState,
    });
    
    // Reset pool on connection failure
    pool = null;
    throw error;
  }
}

export function getPool(): mysql.Pool {
  if (!pool) {
    throw new Error('Database pool not initialized. Call connectDatabase() first.');
  }
  return pool;
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const connection = await getPool().getConnection();
  
  try {
    const start = Date.now();
    const [rows] = await connection.execute(sql, params || []);
    const duration = Date.now() - start;
    
    // Track query metrics (import will be added later to avoid circular dependency)
    if (typeof global !== 'undefined' && (global as any).systemMetricsService) {
      (global as any).systemMetricsService.trackQueryTime(duration);
    }
    
    logger.debug('Executed query', {
      sql: sql.substring(0, 100) + (sql.length > 100 ? '...' : ''),
      params: params ? params.length : 0,
      duration: `${duration}ms`,
      rows: Array.isArray(rows) ? rows.length : 0,
    });
    
    return rows as T[];
  } catch (error) {
    logger.error('Database query error:', {
      sql: sql.substring(0, 100) + (sql.length > 100 ? '...' : ''),
      params,
      error: error instanceof Error ? error.message : error,
      code: (error as any)?.code,
      errno: (error as any)?.errno,
    });
    throw error;
  } finally {
    connection.release();
  }
}

export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const results = await query<T>(sql, params);
  return results.length > 0 ? results[0] ?? null : null;
}

export async function getConnection(): Promise<mysql.PoolConnection> {
  return getPool().getConnection();
}

export async function transaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await getPool().getConnection();
  
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    try {
      await pool.end();
      logger.info('✅ MySQL Database connection closed gracefully');
    } catch (error) {
      logger.error('❌ Error closing database connection:', error);
    } finally {
      pool = null;
    }
  }
}

// Health check function
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  message: string;
  details?: any;
}> {
  try {
    if (!pool) {
      return {
        status: 'unhealthy',
        message: 'Database pool not initialized',
      };
    }

    const connection = await pool.getConnection();
    const start = Date.now();
    
    try {
      const [rows] = await connection.execute('SELECT 1 as health_check, NOW() as server_time');
      const responseTime = Date.now() - start;
      
      return {
        status: 'healthy',
        message: 'MySQL Database connection is healthy',
        details: {
          responseTime: `${responseTime}ms`,
          serverTime: (rows as any)[0]?.server_time,
          connectionLimit: 20, // Use our configured limit
          activeConnections: (pool as any)._allConnections?.length || 0,
        },
      };
    } finally {
      connection.release();
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'MySQL Database connection failed',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code,
        errno: (error as any)?.errno,
      },
    };
  }
}

// Export db object for backward compatibility
export const db = {
  execute: async (sql: string, params?: any[]) => {
    const pool = getPool();
    return pool.execute(sql, params || []);
  },
  query: async (sql: string, params?: any[]) => {
    const pool = getPool();
    return pool.query(sql, params || []);
  }
};
export async function checkDatabaseExists(): Promise<boolean> {
  try {
    const config = createDatabaseConfig();
    
    // Create a temporary connection without specifying database
    const tempPool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
    });

    const connection = await tempPool.getConnection();
    
    try {
      const [rows] = await connection.execute(
        'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
        [config.database]
      );
      
      return Array.isArray(rows) && rows.length > 0;
    } finally {
      connection.release();
      await tempPool.end();
    }
  } catch (error) {
    logger.error('Error checking database existence:', error);
    return false;
  }
}