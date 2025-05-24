import { AppError } from '../../utils/AppError.js';
import logger from '../../utils/logger.js';
// Import your actual project orchestration service
import * as projectOrchestrationService from '../../services/projectOrchestrationService.js';
/**
 * Controller: initiateProjectFromIdeaController
 *
 * Handles the request to initiate a new project based on a user's idea.
 * It calls the project orchestration service to generate a storyboard.
 */
export const initiateProjectFromIdeaController = async (req, // Request body is ICreateProjectRequestBody
res, next) => {
    try {
        const { userIdea } = req.body;
        // const userId = (req as any).user?.id; // Example for when you have authentication
        // The validatorMiddleware should have already checked for userIdea existence
        // but an additional check here can be a safeguard.
        if (!userIdea) {
            // This case should ideally be caught by Zod validation first
            return next(new AppError('User idea is required in the request body.', 400));
        }
        logger.info(`Controller: Received request to initiate project with idea: "${userIdea.substring(0, 70)}..."`);
        // Call the Project Orchestration Service to handle the logic
        const projectResult = await projectOrchestrationService.initiateProjectAndStoryboard(userIdea
        // userId // Pass userId if/when you implement authentication
        );
        logger.info(`Controller: Project initiation successful for idea "${userIdea.substring(0, 70)}...". Project ID: ${projectResult.projectId}`);
        res.status(201).json({
            status: 'success',
            message: 'Project initiated and storyboard generated successfully.',
            data: projectResult, // This will contain { projectId, storyboard } from the service
        });
    }
    catch (error) {
        logger.error(`Controller: Error in initiateProjectFromIdeaController for idea "${req.body?.userIdea?.substring(0, 70)}..."`, error);
        next(error); // Pass errors to the global error handler
    }
};
/**
 * Controller: generateVideoFromStoryboardController
 *
 * Handles the request to generate video scenes from a given storyboard for a project.
 * This calls a service to process scenes and trigger rendering.
 */
export const generateVideoFromStoryboardController = async (req, // Params could be ParamsDictionary or your specific IProjectParams
res, next) => {
    try {
        // projectId is validated by Zod to exist and be a string
        const projectId = req.params.projectId; // Safe assertion due to prior Zod validation
        const { storyboard } = req.body;
        // const userId = (req as any).user?.id; // Example for when you have authentication
        // ValidatorMiddleware should catch empty storyboard, but a safeguard:
        if (!storyboard || storyboard.length === 0) {
            return next(new AppError('A valid storyboard with at least one scene is required.', 400));
        }
        logger.info(`Controller: Received request to generate video for project ID: ${projectId} with ${storyboard.length} scenes.`);
        // Call the Project Orchestration Service
        // In a production app, this might return immediately after queueing jobs.
        // For now, we await its completion for simplicity.
        const videoGenerationResult = await projectOrchestrationService.processStoryboardToVideoScenes(projectId, storyboard, req.body.userIdea || "User's Animation Project" // Pass original idea as topic if available
        // userId
        );
        logger.info(`Controller: Video generation processing completed for project ID: ${projectId}. Status: ${videoGenerationResult.status}`);
        res.status(200).json({
            status: 'success',
            message: 'Video scene generation processing completed.',
            data: videoGenerationResult, // This will contain { projectId, status, scenes: [{ video_url, ... }] }
        });
    }
    catch (error) {
        logger.error(`Controller: Error in generateVideoFromStoryboardController for projectID "${req.params?.projectId}"`, error);
        next(error);
    }
};
/**
 * (Placeholder for a future controller for getting project status)
 * export const getProjectStatusController = async (
 *   req: Request<IProjectParams>, // Using your specific IProjectParams here
 *   res: Response,
 *   next: NextFunction
 * ): Promise<void> => {
 *   try {
 *     const { projectId } = req.params;
 *     logger.info(`Controller: Received request for status of project ID: ${projectId}`);
 *
 *     // const status = await projectOrchestrationService.getProjectStatus(projectId);
 *     // For now, return a placeholder
 *     const placeholderStatus = {
 *       projectId,
 *       overallStatus: "PROCESSING_PLACEHOLDER",
 *       scenesProcessed: 0,
 *       totalScenes: 0,
 *       // detailedSceneStatus: []
 *     };
 *
 *     res.status(200).json({
 *       status: 'success',
 *       data: placeholderStatus,
 *     });
 *   } catch (error) {
 *     logger.error(`Controller: Error in getProjectStatusController for projectID "${req.params?.projectId}"`, error);
 *     next(error);
 *   }
 * };
 */ 
//# sourceMappingURL=projectController.js.map