// src/utils/logger.ts
import config from '../config/index.js';
/**
 * Basic Logger Utility.
 * (Full description from before)
 */
// Define log levels and their numerical severity for comparison
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
}; // Use 'as const' for stricter typing of keys and values
// Determine the current log level's severity from config, default to 'info'
const currentLogLevelName = (config.logging.level || 'info').toLowerCase();
const currentLogLevelSeverity = levels[currentLogLevelName] !== undefined
    ? levels[currentLogLevelName]
    : levels.info;
/**
 * Internal log function that checks the configured log level before printing.
 * @param level The log level of the message.
 * @param message The message string to log.
 * @param optionalParams Any additional parameters to log.
 */
const log = (level, message, ...optionalParams) => {
    if (levels[level] <= currentLogLevelSeverity) {
        const timestamp = new Date().toISOString();
        const levelUpperCase = level.toUpperCase(); // Now 'level' is guaranteed to be a string
        const validOptionalParams = optionalParams.filter(p => p !== undefined);
        // Explicitly map log levels to console methods to satisfy TypeScript
        // and ensure correct console function is called.
        switch (level) {
            case 'error':
                if (validOptionalParams.length > 0) {
                    console.error(`[${timestamp}] [${levelUpperCase}] ${message}`, ...validOptionalParams);
                }
                else {
                    console.error(`[${timestamp}] [${levelUpperCase}] ${message}`);
                }
                break;
            case 'warn':
                if (validOptionalParams.length > 0) {
                    console.warn(`[${timestamp}] [${levelUpperCase}] ${message}`, ...validOptionalParams);
                }
                else {
                    console.warn(`[${timestamp}] [${levelUpperCase}] ${message}`);
                }
                break;
            case 'info':
                if (validOptionalParams.length > 0) {
                    console.info(`[${timestamp}] [${levelUpperCase}] ${message}`, ...validOptionalParams);
                }
                else {
                    console.info(`[${timestamp}] [${levelUpperCase}] ${message}`);
                }
                break;
            case 'debug':
                if (validOptionalParams.length > 0) {
                    console.debug(`[${timestamp}] [${levelUpperCase}] ${message}`, ...validOptionalParams);
                }
                else {
                    console.debug(`[${timestamp}] [${levelUpperCase}] ${message}`);
                }
                break;
            default: // Should not happen with LogLevelString type, but as a fallback
                if (validOptionalParams.length > 0) {
                    console.log(`[${timestamp}] [${levelUpperCase}] ${message}`, ...validOptionalParams);
                }
                else {
                    console.log(`[${timestamp}] [${levelUpperCase}] ${message}`);
                }
        }
    }
};
const logger = {
    error: (message, ...args) => log('error', message, ...args),
    warn: (message, ...args) => log('warn', message, ...args),
    info: (message, ...args) => log('info', message, ...args),
    debug: (message, ...args) => log('debug', message, ...args),
};
export default logger;
//# sourceMappingURL=logger.js.map