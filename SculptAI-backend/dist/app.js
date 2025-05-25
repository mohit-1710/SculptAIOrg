// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config/index.js';
import { AppError } from './utils/AppError.js';
import logger from './utils/logger.js';
// Import the main API router
import apiRoutes from './api/routes/index.js'; // Add .js extension
// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
// --- Core Middleware ---
app.use(cors(config.corsOptions));
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
if (config.env === 'development') {
    app.use(morgan('dev'));
}
else {
    app.use(morgan('short', {
        stream: { write: (message) => logger.info(message.trim()) },
        skip: (req, res) => req.originalUrl === '/health' && res.statusCode < 400,
    }));
}
// --- Static File Serving ---
// Set up static file serving for manim videos
if (config.manimRenderService.useStaticServing) {
    const videoOutputDir = config.manimRenderService.outputDir;
    const staticUrlPrefix = config.manimRenderService.staticUrlPrefix;
    // Check if the path is absolute or relative
    const videosPath = path.isAbsolute(videoOutputDir)
        ? videoOutputDir
        : path.join(__dirname, '..', videoOutputDir);
    logger.info(`Setting up static file serving for videos at ${staticUrlPrefix} from ${videosPath}`);
    // Serve static files from the videos directory
    app.use(staticUrlPrefix, (req, res, next) => {
        // Add CORS headers specifically for video files
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Range');
        res.header('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
        res.header('Cross-Origin-Resource-Policy', 'cross-origin');
        next();
    }, express.static(videosPath, {
        // Set Cache-Control headers for videos
        setHeaders: (res) => {
            res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
        }
    }));
}
// --- Application Routes ---
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});
// Mount main API routes under the configured prefix
app.use(config.api.prefix, apiRoutes); // <--- THIS LINE IS NOW ACTIVE
// --- Error Handling ---
app.use((req, res, next) => {
    next(new AppError(`Route Not Found - ${req.method} ${req.originalUrl}`, 404));
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, req, res, next) => {
    if (err instanceof AppError && err.isOperational) {
        logger.warn(`Operational error: ${err.message}`, {
            statusCode: err.statusCode,
            isOperational: err.isOperational,
            details: err.details,
            path: req.path
        });
    }
    else {
        logger.error('Unhandled error:', {
            error: err,
            message: err.message,
            stack: err.stack,
            path: req.path
        });
    }
    const statusCode = err instanceof AppError ? err.statusCode : 500;
    const message = (err instanceof AppError && err.isOperational) || config.env === 'development'
        ? err.message
        : 'An unexpected internal server error occurred.';
    res.status(statusCode).json({
        status: 'error',
        statusCode,
        message,
        ...(config.env === 'development' && {
            details: err instanceof AppError ? err.details : undefined,
            stack: !(err instanceof AppError && err.isOperational) ? err.stack : undefined
        })
    });
});
export default app;
//# sourceMappingURL=app.js.map