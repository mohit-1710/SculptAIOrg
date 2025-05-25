// src/services/projectOrchestrationService.ts
// Minor comment to trigger re-evaluation
import * as llmService from './llmservice.js';
import * as manimService from './manimservice.js';
import logger from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';
export const initiateProjectAndStoryboard = async (userIdea, userId) => {
    logger.info(`Orchestration: Starting storyboard generation for idea: "${userIdea.substring(0, 70)}..."`, { userId });
    const storyboard = await llmService.generateScriptAndStoryboard(userIdea);
    if (!storyboard || storyboard.length === 0) {
        logger.error('Orchestration: LLM failed to generate a valid storyboard.', { userIdea });
        throw new AppError('Could not generate a storyboard from the provided idea. Please try rephrasing or a different idea.', 500);
    }
    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    logger.info(`Orchestration: Project initiated with ID: ${projectId}. Storyboard has ${storyboard.length} scenes.`);
    // TODO: Database Interaction: Save project and storyboard scenes here.
    return { projectId, storyboard };
};
export const processStoryboardToVideoScenes = async (projectId, storyboard, projectTopic = "User's Animation Project", userId) => {
    logger.info(`Orchestration: Starting video scene generation for project ID: ${projectId}. Number of scenes: ${storyboard.length}. Topic: "${projectTopic}"`);
    const MAX_CORRECTION_ATTEMPTS = 3;
    try {
        // Process a single scene and handle retries
        const processScene = async (sceneData, sceneIndex) => {
            const sceneNumber = sceneIndex + 1;
            let correctionAttempts = 0;
            let sceneProcessedSuccessfully = false;
            let manimCode = "";
            // Get context from previous scene if needed (in parallel execution, we can't rely on sequence)
            // We can only use previous context if it's not the first scene
            const previousSceneContext = sceneIndex > 0
                ? storyboard[sceneIndex - 1].visual_description
                : "";
            logger.info(`Orchestration: Processing scene ${sceneNumber} (\"${sceneData.scene_title}\") for project ${projectId}`);
            while (correctionAttempts <= MAX_CORRECTION_ATTEMPTS && !sceneProcessedSuccessfully) {
                try {
                    // Generate initial Manim code for the scene
                    if (correctionAttempts === 0) {
                        manimCode = await llmService.generateManimCodeForScene({
                            scene_title: sceneData.scene_title,
                            narration: sceneData.narration,
                            visual_description: sceneData.visual_description,
                            scene_number: sceneNumber,
                            total_scenes: storyboard.length,
                            topic: projectTopic,
                            previousSceneContext: previousSceneContext
                        });
                    }
                    // Attempt to render the scene
                    const renderResult = await manimService.renderManimScene(manimCode, `${projectId}_scene_${sceneNumber}`, sceneData.narration // Pass narration text for TTS
                    );
                    // Handle the new response format which could be an object with video_url and audio_url
                    let videoUrl;
                    let audioUrl;
                    if (typeof renderResult === 'string') {
                        // Legacy format - just a video URL string
                        videoUrl = renderResult;
                    }
                    else if (typeof renderResult === 'object') {
                        // New format - object with video_url and optional audio_url
                        videoUrl = renderResult.video_url;
                        audioUrl = renderResult.audio_url;
                    }
                    sceneProcessedSuccessfully = true;
                    // Return successful scene output
                    return {
                        scene_number: sceneNumber,
                        scene_title: sceneData.scene_title,
                        narration: sceneData.narration,
                        visual_description: sceneData.visual_description,
                        manim_code: manimCode,
                        video_url: videoUrl,
                        audio_url: audioUrl,
                        status: 'completed',
                        correction_attempts: correctionAttempts
                    };
                }
                catch (error) {
                    correctionAttempts++;
                    if (error instanceof AppError) {
                        // If it's a linting error or Manim runtime error, try to correct the code
                        if (error.statusCode === 400 || error.statusCode === 500) {
                            if (correctionAttempts <= MAX_CORRECTION_ATTEMPTS) {
                                logger.warn(`Orchestration: Attempting to correct Manim code for scene ${sceneNumber} (attempt ${correctionAttempts}/${MAX_CORRECTION_ATTEMPTS})`, {
                                    error: error.message,
                                    details: error.details,
                                    sceneNumber,
                                    projectId
                                });
                                try {
                                    manimCode = await llmService.correctManimCodeWithLLM(manimCode, error.details, {
                                        scene_number: sceneNumber,
                                        total_scenes: storyboard.length,
                                        topic: projectTopic
                                    });
                                    continue; // Try rendering again with corrected code
                                }
                                catch (correctionError) {
                                    logger.error(`Orchestration: Failed to correct Manim code for scene ${sceneNumber}`, {
                                        error: correctionError instanceof Error ? correctionError.message : String(correctionError),
                                        sceneNumber,
                                        projectId
                                    });
                                    throw correctionError; // Let the outer catch handle this
                                }
                            }
                        }
                        throw error; // Re-throw AppErrors that we can't or shouldn't correct
                    }
                    // For unknown errors, log and throw a new AppError
                    logger.error(`Orchestration: Unexpected error processing scene ${sceneNumber}`, {
                        error: error instanceof Error ? error.message : String(error),
                        sceneNumber,
                        projectId
                    });
                    throw new AppError(`Failed to process scene ${sceneNumber} (${sceneData.scene_title})`, 500, false, {
                        originalError: error instanceof Error ? error.message : String(error),
                        sceneNumber,
                        projectId
                    });
                }
            }
            // If we've exceeded correction attempts, return failed scene
            return {
                scene_number: sceneNumber,
                scene_title: sceneData.scene_title,
                narration: sceneData.narration,
                visual_description: sceneData.visual_description,
                manim_code: manimCode,
                status: 'failed',
                error_message: `Failed to process scene after ${MAX_CORRECTION_ATTEMPTS} correction attempts`,
                correction_attempts: correctionAttempts
            };
        };
        // Create an array of promises for all scenes
        const scenePromises = storyboard.map((scene, index) => processScene(scene, index)
            .then(result => {
            if (result.status === 'completed') {
                logger.info(`Orchestration: Successfully processed scene ${result.scene_number} for project ${projectId}`);
            }
            else {
                logger.warn(`Orchestration: Failed to process scene ${result.scene_number} for project ${projectId}`, {
                    error: result.error_message
                });
            }
            return result;
        })
            .catch(error => {
            // Handle any unhandled errors in scene processing
            logger.error(`Orchestration: Fatal error processing scene ${index + 1}`, {
                error: error instanceof Error ? error.message : String(error),
                projectId
            });
            // Return a failed scene object instead of throwing to allow other scenes to continue
            return {
                scene_number: index + 1,
                scene_title: storyboard[index].scene_title,
                narration: storyboard[index].narration,
                visual_description: storyboard[index].visual_description,
                manim_code: "",
                status: 'failed',
                error_message: error instanceof Error ? error.message : String(error)
            };
        }));
        // Process all scenes in parallel
        const sceneOutputs = await Promise.all(scenePromises);
        const successfulScenes = sceneOutputs.filter(s => s.status === 'completed');
        let overallStatus = 'failed';
        if (successfulScenes.length === storyboard.length) {
            overallStatus = 'completed';
        }
        else if (successfulScenes.length > 0) {
            overallStatus = 'partially_completed';
        }
        logger.info(`Orchestration: Finished processing all scenes for project ${projectId}. Overall status: ${overallStatus}. Successful scenes: ${successfulScenes.length}/${storyboard.length}`);
        return {
            projectId,
            userIdea: projectTopic,
            storyboard,
            status: overallStatus,
            scenes: sceneOutputs,
        };
    }
    catch (error) {
        // Handle any errors that occurred during the overall process
        logger.error('Orchestration: Failed to process storyboard to video scenes', {
            error: error instanceof Error ? error.message : String(error),
            projectId
        });
        if (error instanceof AppError)
            throw error;
        throw new AppError('Failed to process storyboard to video scenes', 500, false, {
            originalError: error instanceof Error ? error.message : String(error),
            projectId
        });
    }
};
//# sourceMappingURL=projectOrchestrationService.js.map