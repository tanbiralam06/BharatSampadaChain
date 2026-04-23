import express from 'express';
import { config } from './config';
import { connectToFabric, disconnectFabric } from './fabric/connection';
import { redis } from './cache/redis';

import authRouter from './routes/auth';
import citizensRouter from './routes/citizens';
import propertiesRouter from './routes/properties';
import flagsRouter from './routes/flags';
import zkpRouter from './routes/zkp';
import adminRouter from './routes/admin';
import { authenticate } from './middleware/auth';

const app = express();
app.use(express.json());

// Public health probe (no auth)
app.get('/health', (_req, res) => res.json({ status: 'ok', version: '1.0.0' }));

// Routes
app.use('/auth', authRouter);
app.use('/citizens', citizensRouter);
app.use('/properties', propertiesRouter);
app.use('/flags', flagsRouter);
app.use('/zkp', zkpRouter);
app.use('/admin', adminRouter);

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ success: false, error: err.message ?? 'Internal server error' });
});

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
