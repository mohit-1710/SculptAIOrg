// src/app.ts
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config/index.js';
import { AppError } from './utils/AppError.js';
import logger from './utils/logger.js';

// Import the main API router
import apiRoutes from './api/routes/index.js'; // Add .js extension

const app: Application = express();

// --- Core Middleware ---
app.use(cors(config.corsOptions));
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('short', {
    stream: { write: (message) => logger.info(message.trim()) },
    skip: (req: Request, res: Response) => req.originalUrl === '/health' && res.statusCode < 400,
  }));
}

// --- Application Routes ---
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Mount main API routes under the configured prefix
app.use(config.api.prefix, apiRoutes); // <--- THIS LINE IS NOW ACTIVE

// --- Error Handling ---
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Route Not Found - ${req.method} ${req.originalUrl}`, 404));
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error | AppError, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError && err.isOperational) {
    logger.warn(`Operational error: ${err.message}`, { /* ... */ });
  } else {
    logger.error('Unhandled error:', err);
  }
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = (err instanceof AppError && err.isOperational) || config.env === 'development'
    ? err.message
    : 'An unexpected internal server error occurred.';
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    ...(config.env === 'development' && !(err instanceof AppError && err.isOperational) && { stack: err.stack }),
  });
});

export default app;