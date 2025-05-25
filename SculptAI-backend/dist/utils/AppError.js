// src/utils/AppError.ts
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
export class AppError extends Error {
    /**
     * Creates an instance of AppError.
     * @param message The error message string.
     * @param statusCode The HTTP status code for this error.
     * @param isOperational Optional. Indicates if this is an operational error. Defaults to true.
     *                      Set to false for unexpected programming errors.
     */
    constructor(message, statusCode, isOperational = true, details) {
        super(message); // Call the parent Error constructor with the message
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.details = details;
        // Set the name of the error to the class name
        // This is helpful for identifying the type of error, e.g., in logging.
        this.name = this.constructor.name;
        // Capture the stack trace, excluding the constructor call from it,
        // for more accurate error origin identification in Node.js environments.
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
//# sourceMappingURL=AppError.js.map