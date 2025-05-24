// src/config/index.ts
import dotenv from 'dotenv';
// Load environment variables from .env file
// This should be done as early as possible
dotenv.config();
/**
 * Application Configuration Object.
 * Centralizes all configuration values, prioritizing environment variables
 * and providing sensible defaults for development.
 */
const config = {
    /**
     * The current running environment (e.g., 'development', 'production').
     */
    env: process.env.NODE_ENV || 'development',
    /**
     * The port number the application server will listen on.
     */
    port: parseInt(process.env.PORT || '5000', 10), // Default to 5000 if PORT not set
    /**
     * API related configurations.
     */
    api: {
        /**
         * The prefix for all API routes (e.g., '/api/v1').
         */
        prefix: process.env.API_PREFIX || '/api/v1',
    },
    /**
     * CORS (Cross-Origin Resource Sharing) configuration.
     */
    corsOptions: {
        /**
         * Specifies the origin(s) allowed to make requests.
         * For production, list your frontend domain(s).
         */
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000', // Your frontend dev URL
    },
    /**
     * Google Generative AI (Gemini) API Key.
     * CRITICAL: Ensure this is set in your .env file for production.
     */
    googleGenerativeAiApiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    /**
     * Configuration for LLM models to be used.
     */
    llmModels: {
        scripting: process.env.GEMINI_MODEL_SCRIPTING || 'gemini-2.5-flash-preview-04-17', // Or 'gemini-pro'
        manimCode: process.env.GEMINI_MODEL_MANIM_CODE || 'gemini-2.5-pro-preview-05-06', // Or 'gemini-1.5-flash-latest'
    },
    /**
     * Manim Rendering Service configurations (you'll add this URL to .env later).
     */
    manimRenderService: {
        endpoint: process.env.MANIM_RENDER_ENDPOINT || 'http://localhost:8080/render', // Default for local dev
        timeout: parseInt(process.env.MANIM_RENDER_TIMEOUT_MS || '300000', 10), // 5 minutes
    },
    /**
     * Logging configuration.
     */
    logging: {
        level: process.env.LOG_LEVEL || 'info', // e.g., 'debug', 'info', 'warn', 'error'
    },
};
// Freeze the config object to prevent accidental modifications at runtime.
export default Object.freeze(config);
//# sourceMappingURL=index.js.map