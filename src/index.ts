import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './utils/logger';
import { connectWithRetry, closePool } from './db/client';
import healthRoutes from './routes/health';
import indexRoutes from './routes/index';
import exampleRoutes from './routes/example';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use(healthRoutes);
app.use(indexRoutes);
app.use(exampleRoutes);

// Graceful shutdown
let isShuttingDown = false;

function shutdown(signal: string): void {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`Received ${signal}, starting graceful shutdown`);

  server.close(async () => {
    logger.info('HTTP server closed');
    await closePool();
    logger.info('Shutdown complete');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
const server = app.listen(PORT, async () => {
  logger.info(`Server listening on port ${PORT}`, { port: PORT });

  if (process.env.DATABASE_URL) {
    try {
      await connectWithRetry();
    } catch (err) {
      logger.error('Failed to connect to database on startup', { error: String(err) });
    }
  } else {
    logger.warn('DATABASE_URL not set, skipping database connection');
  }
});

export { app, server };
