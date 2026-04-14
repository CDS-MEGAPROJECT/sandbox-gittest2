import { Router, Request, Response } from 'express';

const router = Router();

const startTime = Date.now();

router.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
  });
});

export default router;
