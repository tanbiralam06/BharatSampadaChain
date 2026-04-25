import 'dotenv/config';
import { config } from './config';
import { connectToFabric, disconnectFabric } from './fabric/connection';
import { redis } from './cache/redis';
import app from './app';

async function start() {
  try {
    await redis.connect().catch(() => {
      console.warn('Redis unavailable — running without cache');
    });

    await connectToFabric();

    app.listen(config.port, () => {
      console.log(`BSC API running on port ${config.port} [${config.nodeEnv}]`);
    });
  } catch (err) {
    console.error('Failed to start API:', err);
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  disconnectFabric();
  process.exit(0);
});

start();
