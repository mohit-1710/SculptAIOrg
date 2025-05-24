// src/api/routes/projectRoutes.ts
import { Router } from 'express';
import * as projectController from '../controllers/projectController.js'; // We'll create this next
import { validate } from '../middlewares/validatorMiddleware.js'; // We'll create this next
import { createProjectIdeaSchema, generateVideoFromStoryboardSchema, } from '../validators/projectValidators.js'; // Import your Zod schemas
/**
 * Project Routes.
 *
 * Defines API endpoints related to project creation, video generation from storyboards,
 * and potentially other project-specific operations.
 *
 * It uses the `validate` middleware to ensure incoming request data conforms to
 * defined Zod schemas before reaching the controller logic.
 */
const router = Router();
// If you add authentication later, you might apply it here:
// import authMiddleware from '../middlewares/authMiddleware.js';
// router.use(authMiddleware);
/**
 * @route   POST /initiate
 * @desc    Initiate a new project from a user's idea, generating a storyboard.
 * @access  Public (or Private if authMiddleware is used)
 */
router.post('/initiate', validate(createProjectIdeaSchema), // Apply Zod validation to the request
projectController.initiateProjectFromIdeaController // Controller function to handle the logic
);
/**
 * @route   POST /:projectId/generate-video
 * @desc    Generate video scenes from a provided storyboard for a specific project.
 * @access  Public (or Private if authMiddleware is used)
 */
router.post('/:projectId/generate-video', validate(generateVideoFromStoryboardSchema), // Validate params and body
//@ts-ignore
projectController.generateVideoFromStoryboardController // Controller function
);
/**
 * @route   GET /:projectId/status
 * @desc    (Example) Get the status of a video generation project.
 * @access  Public (or Private if authMiddleware is used)
 */
// router.get(
//   '/:projectId/status',
//   // validate(getProjectStatusSchema), // You'd create a schema for params if needed
//   projectController.getProjectStatusController // Example for a future controller
// );
export default router;
//# sourceMappingURL=projectRoutes.js.map