"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/utils/logger.ts
var index_js_1 = require("../config/index.js");
/**
 * Basic Logger Utility.
 * (Full description from before)
 */
// Define log levels and their numerical severity for comparison
var levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
}; // Use 'as const' for stricter typing of keys and values
// Determine the current log level's severity from config, default to 'info'
var currentLogLevelName = (index_js_1.default.logging.level || 'info').toLowerCase();
var currentLogLevelSeverity = levels[currentLogLevelName] !== undefined
    ? levels[currentLogLevelName]
    : levels.info;
/**
 * Internal log function that checks the configured log level before printing.
 * @param level The log level of the message.
 * @param message The message string to log.
 * @param optionalParams Any additional parameters to log.
 */
var log = function (level, message) {
    var optionalParams = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        optionalParams[_i - 2] = arguments[_i];
    }
    if (levels[level] <= currentLogLevelSeverity) {
        var timestamp = new Date().toISOString();
        var levelUpperCase = level.toUpperCase(); // Now 'level' is guaranteed to be a string
        var validOptionalParams = optionalParams.filter(function (p) { return p !== undefined; });
        // Explicitly map log levels to console methods to satisfy TypeScript
        // and ensure correct console function is called.
        switch (level) {
            case 'error':
                if (validOptionalParams.length > 0) {
                    console.error.apply(console, __spreadArray(["[".concat(timestamp, "] [").concat(levelUpperCase, "] ").concat(message)], validOptionalParams, false));
                }
                else {
                    console.error("[".concat(timestamp, "] [").concat(levelUpperCase, "] ").concat(message));
                }
                break;
            case 'warn':
                if (validOptionalParams.length > 0) {
                    console.warn.apply(console, __spreadArray(["[".concat(timestamp, "] [").concat(levelUpperCase, "] ").concat(message)], validOptionalParams, false));
                }
                else {
                    console.warn("[".concat(timestamp, "] [").concat(levelUpperCase, "] ").concat(message));
                }
                break;
            case 'info':
                if (validOptionalParams.length > 0) {
                    console.info.apply(console, __spreadArray(["[".concat(timestamp, "] [").concat(levelUpperCase, "] ").concat(message)], validOptionalParams, false));
                }
                else {
                    console.info("[".concat(timestamp, "] [").concat(levelUpperCase, "] ").concat(message));
                }
                break;
            case 'debug':
                if (validOptionalParams.length > 0) {
                    console.debug.apply(console, __spreadArray(["[".concat(timestamp, "] [").concat(levelUpperCase, "] ").concat(message)], validOptionalParams, false));
                }
                else {
                    console.debug("[".concat(timestamp, "] [").concat(levelUpperCase, "] ").concat(message));
                }
                break;
            default: // Should not happen with LogLevelString type, but as a fallback
                if (validOptionalParams.length > 0) {
                    console.log.apply(console, __spreadArray(["[".concat(timestamp, "] [").concat(levelUpperCase, "] ").concat(message)], validOptionalParams, false));
                }
                else {
                    console.log("[".concat(timestamp, "] [").concat(levelUpperCase, "] ").concat(message));
                }
        }
    }
};
var logger = {
    error: function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return log.apply(void 0, __spreadArray(['error', message], args, false));
    },
    warn: function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return log.apply(void 0, __spreadArray(['warn', message], args, false));
    },
    info: function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return log.apply(void 0, __spreadArray(['info', message], args, false));
    },
    debug: function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return log.apply(void 0, __spreadArray(['debug', message], args, false));
    },
};
exports.default = logger;
