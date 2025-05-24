// src/services/manimService.ts
import axios from 'axios';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';
export const renderManimScene = async (manimCode, sceneId) => {
    logger.info(`Sending Manim code to render service for scene ID: ${sceneId}`);
    logger.debug(`Manim code for ${sceneId} (first 150 chars): ${manimCode.substring(0, 150)}...`);
    if (!config.manimRenderService.endpoint) {
        logger.error("Manim Render Service endpoint is not configured.");
        throw new AppError("Manim Render Service is not configured.", 500, false);
    }
    try {
        const response = await axios.post(config.manimRenderService.endpoint, {
            manim_code: manimCode,
            scene_identifier: sceneId,
        }, {
            timeout: config.manimRenderService.timeout,
        });
        // --- CORRECTED SUCCESS CONDITION ---
        // Check if the renderer indicates success AND provides either a cloud URL or a local filename
        if (response.data && response.status === 200) { // Check for 200 OK from renderer
            if (response.data.video_url && typeof response.data.video_url === 'string') {
                logger.info(`Manim scene ${sceneId} rendered (cloud). Video URL: ${response.data.video_url}`);
                return response.data.video_url; // This is what the orchestration service expects
            }
            else if (response.data.video_filename_on_host && typeof response.data.video_filename_on_host === 'string') {
                logger.info(`Manim scene ${sceneId} rendered (local). Filename: ${response.data.video_filename_on_host}. Path in container: ${response.data.container_save_path}`);
                // IMPORTANT: The orchestration service expects a URL.
                // For local saving, we don't have a directly web-accessible URL unless you set up a local file server.
                // For now, let's return a placeholder or the filename, and the orchestration service
                // needs to be aware of this difference if it strictly needs a URL for further processing.
                // Ideally, the Python service should always aim to provide a URL (e.g., S3 presigned URL for local files if served temporarily).
                // For this iteration, we will return the filename, and the consuming service needs to know this is not a direct URL.
                // A better approach would be for the python service to return a more structured success object.
                // Let's return a "conceptual URL" or the filename as a string for now.
                // The orchestrator will store this. The frontend would need a different way to access local files.
                return `localfile:${response.data.video_filename_on_host}`; // Or just response.data.video_filename_on_host
            }
            else if (response.data.error) { // Renderer might have returned 200 but with an error message
                logger.error('Manim render service returned 200 but with an error in its payload.', {
                    responseData: response.data, sceneId
                });
                throw new AppError(`Manim rendering service reported an error: ${response.data.error}`, 502);
            }
            else {
                // Successful status code but unexpected payload
                logger.error('Manim render service returned 200 but with an unexpected payload structure.', {
                    responseData: response.data, sceneId
                });
                throw new AppError('Manim rendering service returned an unexpected success payload.', 502);
            }
        }
        else if (response.data && response.data.error) { // If renderer returned non-200 but with JSON error
            logger.error('Manim render service returned an error payload.', {
                status: response.status, responseData: response.data, sceneId
            });
            throw new AppError(`Manim rendering service failed: ${response.data.error}`, response.status || 502);
        }
        else {
            // Non-200 status without a specific error in data
            logger.error('Manim render service returned an unexpected non-200 status or invalid response.', {
                status: response.status, responseData: response.data, sceneId
            });
            throw new AppError('Manim rendering service returned an unexpected response.', response.status || 502);
        }
    }
    catch (error) {
        const axiosError = error;
        if (axiosError.isAxiosError) {
            const responseData = axiosError.response?.data;
            const serviceErrorMessage = responseData?.error || responseData?.details_stderr || responseData?.message || axiosError.message;
            logger.error(`Axios error calling Manim render service for scene ${sceneId}:`, {
                message: serviceErrorMessage,
                code: axiosError.code,
                status: axiosError.response?.status,
                responseData: responseData,
            });
            if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
                throw new AppError(`Manim rendering for scene ${sceneId} timed out.`, 504);
            }
            throw new AppError(`Failed to render Manim scene ${sceneId}. Service Error: ${serviceErrorMessage}`, axiosError.response?.status || 502);
        }
        logger.error(`Unexpected error in renderManimScene for scene ${sceneId}:`, error);
        throw new AppError('An unexpected error occurred while trying to render the Manim scene.', 500, false);
    }
};
//# sourceMappingURL=manimservice.js.map