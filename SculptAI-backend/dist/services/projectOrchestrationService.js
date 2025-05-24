// src/services/projectOrchestrationService.ts
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
    const sceneOutputs = [];
    let previousSceneVisualContext = "";
    let manimCode = ""; // Declare here to be accessible in catch block
    for (let i = 0; i < storyboard.length; i++) {
        const currentSceneData = storyboard[i];
        const sceneNumber = i + 1;
        const sceneJobId = `${projectId}_scene_${sceneNumber}_${Date.now()}`;
        manimCode = ""; // Reset for each scene
        logger.info(`Orchestration: Processing scene ${sceneNumber}/${storyboard.length} ("${currentSceneData.scene_title}") for project ${projectId}`);
        try {
            logger.debug(`Orchestration: Calling LLM to generate Manim code for scene ${sceneNumber}.`);
            manimCode = await llmService.generateManimCodeForScene({
                narration: currentSceneData.narration,
                visual_description: currentSceneData.visual_description,
                scene_number: sceneNumber,
                total_scenes: storyboard.length,
                topic: projectTopic,
                previousSceneContext: previousSceneVisualContext,
            });
            // --- Log the generated Manim code ---
            logger.info(`Orchestration: Manim code generated for scene ${sceneNumber}:\n${manimCode}`);
            // --- End Log ---
            logger.debug(`Orchestration: Calling Manim service to render scene ${sceneNumber}.`);
            const videoUrl = await manimService.renderManimScene(manimCode, sceneJobId);
            sceneOutputs.push({
                scene_number: sceneNumber,
                scene_title: currentSceneData.scene_title,
                narration: currentSceneData.narration,
                manim_code_generated: manimCode,
                video_url: videoUrl,
                status: 'completed',
            });
            previousSceneVisualContext = `Scene ${sceneNumber} showed: ${currentSceneData.visual_description}`;
            logger.info(`Orchestration: Scene ${sceneNumber} for project ${projectId} processed successfully. Video at: ${videoUrl}`);
        }
        catch (sceneError) {
            const errorMessage = sceneError instanceof Error ? sceneError.message : 'Unknown error processing scene.';
            logger.error(`Orchestration: Error processing scene ${sceneNumber} ("${currentSceneData.scene_title}") for project ${projectId}:`, sceneError);
            sceneOutputs.push({
                scene_number: sceneNumber,
                scene_title: currentSceneData.scene_title,
                narration: currentSceneData.narration,
                manim_code_generated: manimCode, // Include code even if render failed
                status: 'failed',
                error_message: errorMessage,
            });
        }
    }
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
};
//# sourceMappingURL=projectOrchestrationService.js.map