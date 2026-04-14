import { Router, Request, Response } from 'express';
import { getPool } from '../db/client';
import { logger } from '../utils/logger';

const router = Router();

router.get('/api/example', async (_req: Request, res: Response) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT id, name, created_at FROM examples ORDER BY created_at DESC LIMIT 10');
    res.json({ data: result.rows });
  } catch (err) {
    logger.error('Failed to query examples', { error: String(err) });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
