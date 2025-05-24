// src/services/manimService.ts
import axios from 'axios';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';
/**
 * renderManimScene
 *
 * Sends Manim Python code to the rendering service.
 * @param manimCode The Manim Python code string.
 * @param sceneId A unique identifier for the scene (for tracking/logging).
 * @returns A Promise resolving to the URL of the rendered video.
 */
export const renderManimScene = async (manimCode, sceneId) => {
    logger.info(`Sending Manim code to render service for scene ID: ${sceneId}`);
    logger.debug(`Manim code for ${sceneId} (first 150 chars): ${manimCode.substring(0, 150)}...`);
    if (!config.manimRenderService.endpoint) {
        logger.error("Manim Render Service endpoint is not configured.");
        throw new AppError("Manim Render Service is not configured.", 500, false);
    }
    try {
        const response = await axios.post(// Specify expected response type
        config.manimRenderService.endpoint, {
            manim_code: manimCode,
            scene_identifier: sceneId,
        }, {
            timeout: config.manimRenderService.timeout,
        });
        // Check if the response indicates success and contains a video_url
        if (response.data && response.data.video_url && typeof response.data.video_url === 'string') {
            logger.info(`Manim scene ${sceneId} rendered successfully by service. Video URL: ${response.data.video_url}`);
            return response.data.video_url;
        }
        else {
            // Handle cases where the rendering service might return an error in its JSON body
            const serviceErrorMessage = response.data?.error || response.data?.message || 'Unknown error from rendering service.';
            logger.error('Manim render service returned an error or invalid response structure.', {
                responseData: response.data,
                sceneId,
                serviceErrorMessage,
            });
            throw new AppError(`Manim rendering service reported an error: ${serviceErrorMessage}`, 502 // Bad Gateway, as our service depends on another
            );
        }
    }
    catch (error) {
        const axiosError = error; // Type the error for Axios
        if (axiosError.isAxiosError) {
            const responseData = axiosError.response?.data;
            const serviceErrorMessage = responseData?.error || responseData?.message || axiosError.message;
            logger.error(`Axios error calling Manim render service for scene ${sceneId}:`, {
                message: serviceErrorMessage,
                code: axiosError.code,
                status: axiosError.response?.status,
                responseData: responseData,
            });
            if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') { // Timeout
                throw new AppError(`Manim rendering for scene ${sceneId} timed out.`, 504); // Gateway Timeout
            }
            // Use status from rendering service if available, otherwise 502
            throw new AppError(`Failed to render Manim scene ${sceneId}. Service Error: ${serviceErrorMessage}`, axiosError.response?.status || 502);
        }
        // For non-Axios errors
        logger.error(`Unexpected error in renderManimScene for scene ${sceneId}:`, error);
        throw new AppError('An unexpected error occurred while trying to render the Manim scene.', 500, false);
    }
};
//# sourceMappingURL=manimservice.js.map