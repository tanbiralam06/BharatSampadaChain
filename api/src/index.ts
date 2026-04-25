import 'dotenv/config';
import { config } from './config';
import { connectToFabric, disconnectFabric } from './fabric/connection';
import { redis } from './cache/redis';
import { logger } from './utils/logger';
import app from './app';

async function start() {
  try {
    await redis.connect().catch(() => {
      logger.warn('Redis unavailable — running without cache');
    });

    await connectToFabric();

    app.listen(config.port, () => {
      logger.info(`BSC API running on port ${config.port}`, { env: config.nodeEnv });
    });
  } catch (err) {
    logger.error('Failed to start API', { err });
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  disconnectFabric();
  process.exit(0);
});

start();
