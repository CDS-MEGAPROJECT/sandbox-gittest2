import { Pool } from 'pg';
import { logger } from '../utils/logger';

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: parseInt(process.env.DB_POOL_SIZE || '10', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      logger.error('Unexpected database pool error', { error: String(err) });
    });
  }
  return pool;
}

export async function connectWithRetry(): Promise<Pool> {
  const dbPool = getPool();

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const client = await dbPool.connect();
      client.release();
      logger.info('Database connected successfully', { attempt });
      return dbPool;
    } catch (err) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      logger.warn(`Database connection attempt ${attempt}/${MAX_RETRIES} failed, retrying in ${delay}ms`, {
        error: String(err),
      });

      if (attempt === MAX_RETRIES) {
        logger.error('All database connection attempts exhausted');
        throw err;
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error('Database connection failed');
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database pool closed');
  }
}
