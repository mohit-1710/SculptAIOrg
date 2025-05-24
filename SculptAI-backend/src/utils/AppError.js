"use strict";
// src/utils/AppError.ts
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
/**
 * Custom Error Class - AppError
 *
 * Extends the built-in Error class to include additional properties useful for
 * handling errors in an HTTP context:
 * - `statusCode`: The HTTP status code appropriate for the error (e.g., 400, 404, 500).
 * - `isOperational`: A boolean flag to distinguish between operational errors
 *   (expected issues like invalid user input) and programming errors (bugs).
 *   This helps in deciding how to log or respond to the error.
 */
var AppError = /** @class */ (function (_super) {
    __extends(AppError, _super);
    /**
     * Creates an instance of AppError.
     * @param message The error message string.
     * @param statusCode The HTTP status code for this error.
     * @param isOperational Optional. Indicates if this is an operational error. Defaults to true.
     *                      Set to false for unexpected programming errors.
     */
    function AppError(message, statusCode, isOperational) {
        if (isOperational === void 0) { isOperational = true; }
        var _this = _super.call(this, message) || this; // Call the parent Error constructor with the message
        _this.statusCode = statusCode;
        _this.isOperational = isOperational;
        // Set the name of the error to the class name
        // This is helpful for identifying the type of error, e.g., in logging.
        _this.name = _this.constructor.name;
        // Capture the stack trace, excluding the constructor call from it,
        // for more accurate error origin identification in Node.js environments.
        if (Error.captureStackTrace) {
            Error.captureStackTrace(_this, _this.constructor);
        }
        return _this;
    }
    return AppError;
}(Error));
exports.AppError = AppError;
