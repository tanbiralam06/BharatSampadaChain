import express from 'express';
import cors from 'cors';
import { logger } from './utils/logger';
import { apiLimiter, authLimiter } from './middleware/rateLimiter';

import authRouter from './routes/auth';
import citizensRouter from './routes/citizens';
import propertiesRouter from './routes/properties';
import flagsRouter from './routes/flags';
import zkpRouter from './routes/zkp';
import adminRouter from './routes/admin';

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173', // public-dashboard
    'http://localhost:5174', // citizen-dashboard
    'http://localhost:5175', // officer-console
    'http://localhost:5176', // admin-panel
  ],
  credentials: true,
}));

app.use(express.json());
app.use(apiLimiter);

// HTTP request logger
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

app.get('/health', (_req, res) => res.json({ status: 'ok', version: '1.0.0' }));

app.use('/auth', authLimiter, authRouter);
app.use('/citizens', citizensRouter);
app.use('/properties', propertiesRouter);
app.use('/flags', flagsRouter);
app.use('/zkp', zkpRouter);
app.use('/admin', adminRouter);

app.use((err: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status ?? 500;
  if (status >= 500) logger.error('Unhandled error', { message: err.message, stack: err.stack });
  else               logger.warn('Request error', { status, message: err.message });
  res.status(status).json({ success: false, error: err.message ?? 'Internal server error' });
});

export default app;
