// src/api/middlewares/validatorMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../../utils/AppError.js'; // Import your custom AppError
import logger from '../../utils/logger.js';     // Import your logger

/**
 * Validation Middleware using Zod.
 *
 * This middleware function takes a Zod schema and validates the incoming request's
 * body, query parameters, and URL parameters against that schema.
 *
 * If validation fails, it constructs an `AppError` with a 400 status code and
 * user-friendly error messages derived from Zod's error output, then passes
 * this error to the global error handler.
 *
 * If validation succeeds, it calls `next()` to pass control to the next
 * middleware or route handler in the stack.
 *
 * @param schema A Zod schema object (e.g., from `z.object({...})`).
 * @returns An Express middleware function.
 */
export const validate =
  (schema: AnyZodObject) => // Takes a Zod schema as an argument
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Attempt to parse and validate the request parts against the schema.
      // Zod's `parseAsync` (or `parse`) will throw a ZodError if validation fails.
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // If validation is successful, proceed to the next handler.
      return next();
    } catch (error: unknown) {
      // Check if the error is an instance of ZodError
      if (error instanceof ZodError) {
        // Format Zod errors into a more user-friendly array of messages
        const errorMessages = error.errors.map((issue) => ({
          field: issue.path.join('.'), // e.g., 'body.userIdea'
          message: issue.message,
        }));

        logger.warn('Input validation failed:', { errors: errorMessages, path: req.path });

        // Create an AppError with a 400 status and a summary message
        // You can choose to include the detailed `errorMessages` in the AppError
        // or just a general message. For client-side display, details are good.
        return next(
          new AppError(
            `Input validation failed. ${errorMessages.map(e => `${e.field}: ${e.message}`).join('; ')}`,
            400, // Bad Request
            true, // isOperational
            { errors: errorMessages }
          )
        );
      }

      // If it's not a ZodError, it's an unexpected error.
      logger.error('Unexpected error during validation middleware:', error);
      return next(
        new AppError('An unexpected error occurred during input validation.', 500, false, {
          originalError: error instanceof Error ? error.message : String(error)
        })
      );
    }
  };