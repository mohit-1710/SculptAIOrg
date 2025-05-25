// src/services/manimService.ts
import axios from 'axios';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';
import { generateNarrationAudio } from './ttsService.js';
import { uploadVideo } from './storageService.js';
/**
 * Common Manim import issues and their fixes
 */
const COMMON_IMPORT_FIXES = {
    'BLACK': 'Replace "from manim.constants import BLACK" with "from manim import BLACK"',
    'WHITE': 'Replace "from manim.constants import WHITE" with "from manim import WHITE"',
    'CENTER': 'Replace "from manim import CENTER" with "from manim.constants import ORIGIN"',
    'rate_functions': 'Replace "from manim.animation.rate_functions" with "from manim.utils.rate_functions"'
};
/**
 * Sanitize Manim code to handle common issues
 * @param manimCode The original Manim code
 * @returns Sanitized Manim code
 */
const sanitizeManimCode = (manimCode) => {
    // Replace HTML <br> tags with newlines
    let sanitizedCode = manimCode.replace(/<br\s*\/?>/gi, '\n');
    // Fix common import patterns for Manim v0.18.0
    sanitizedCode = sanitizedCode
        .replace(/from\s+manim\.constants\s+import\s+([^;]+)/g, 'from manim import $1')
        .replace(/from\s+manim\.animation\.rate_functions\s+import\s+([^;]+)/g, 'from manim.utils.rate_functions import $1');
    // Handle quotes in strings (ensure they're properly escaped)
    sanitizedCode = sanitizedCode.replace(/(\")(.*)(\\")(.*)(\")/g, '$1$2\\\\$3$4$5');
    return sanitizedCode;
};
export const renderManimScene = async (manimCode, sceneId, narrationText) => {
    logger.info(`Sending Manim code to render service for scene ID: ${sceneId}`);
    logger.debug(`Manim code for ${sceneId} (first 150 chars): ${manimCode.substring(0, 150)}...`);
    if (!config.manimRenderService.endpoint) {
        logger.error("Manim Render Service endpoint is not configured.");
        throw new AppError("Manim Render Service is not configured.", 500, false);
    }
    // Sanitize the Manim code before sending to renderer
    const sanitizedManimCode = sanitizeManimCode(manimCode);
    try {
        const response = await axios.post(`${config.manimRenderService.endpoint}/render`, {
            manim_code: sanitizedManimCode,
            scene_id: sceneId,
            scene_identifier: sceneId // Add scene_identifier parameter with the same value for compatibility
        }, {
            timeout: config.manimRenderService.timeout,
            allowAbsoluteUrls: true // Enable absolute URLs in responses
        });
        // --- Handle 200 Success Cases ---
        if (response.status === 200) {
            // Check for video_url (cloud storage case)
            if (response.data.video_url) {
                logger.info(`Manim render service successfully rendered scene ${sceneId} to cloud:`, {
                    videoUrl: response.data.video_url,
                    sceneId
                });
                // If narration is enabled and text is provided, add TTS
                if (config.tts.enabled && narrationText) {
                    // Generate narration audio
                    const audioUrl = await generateNarrationAudio(narrationText, sceneId);
                    // Return object with both video and audio URLs
                    return {
                        video_url: response.data.video_url,
                        audio_url: audioUrl,
                        scene_identifier: response.data.scene_identifier // Pass through scene_identifier
                    };
                }
                return {
                    video_url: response.data.video_url,
                    scene_identifier: response.data.scene_identifier // Pass through scene_identifier
                };
            }
            // No video_url means the new Railway service did not behave as expected or an old local-first service responded.
            else if (response.data.error) { // Renderer might have returned 200 but with an error message
                logger.error('Manim render service returned 200 but with an error in its payload.', {
                    responseData: response.data,
                    sceneId
                });
                throw new AppError(`Manim rendering service reported an error: ${response.data.error}`, 502, true, {
                    type: 'RENDERER_PAYLOAD_ERROR_ON_200',
                    renderer_response: response.data,
                    original_manim_code: manimCode // Include the original code for debugging
                });
            }
            else {
                // Successful status code but unexpected payload (missing video_url)
                logger.error('Manim render service returned 200 but with an unexpected payload structure (missing video_url).', {
                    responseData: response.data,
                    sceneId
                });
                throw new AppError('Manim rendering service returned an unexpected success payload (missing video_url).', 502, true, {
                    type: 'RENDERER_UNEXPECTED_SUCCESS_PAYLOAD',
                    renderer_response: response.data,
                    original_manim_code: manimCode // Include the original code for debugging
                });
            }
        }
        // --- Handle 400 for Linting Errors ---
        if (response.status === 400 && response.data?.error?.includes('Linting failed')) {
            logger.warn(`Manim service reported linting errors for scene ${sceneId}:`, {
                status: response.status,
                responseData: response.data
            });
            throw new AppError(`Linting failed for Manim code in scene ${sceneId}: ${response.data.details_stdout || response.data.error}`, 400, // Keep 400 status
            true, // Operational error
            {
                type: 'LINTING_ERROR',
                sceneId: sceneId,
                renderer_response: response.data,
                original_manim_code: manimCode // Include the original code for debugging
            });
        }
        // --- Handle 500 for Manim Rendering Errors ---
        if (response.status === 500) {
            // Check for specific import errors to provide better error messages
            const stderrText = response.data.details_stderr || '';
            const importError = Object.keys(COMMON_IMPORT_FIXES).find(key => stderrText.includes(`cannot import name '${key}'`) ||
                stderrText.includes(`No module named 'manim.animation.rate_functions'`));
            const errorDetails = importError
                ? `${response.data.parsed_error || response.data.details_stderr || response.data.error}. Suggestion: ${COMMON_IMPORT_FIXES[importError]}`
                : response.data.parsed_error || response.data.details_stderr || response.data.error;
            logger.error('Manim render service returned a 500 error (Manim process failure).', {
                status: response.status,
                responseData: response.data,
                sceneId,
                importError: importError ? COMMON_IMPORT_FIXES[importError] : undefined
            });
            throw new AppError(`Manim rendering process failed for scene ${sceneId}: ${errorDetails}`, 500, // Keep 500 status
            true, // Operational error
            {
                type: 'MANIM_RUNTIME_ERROR',
                sceneId: sceneId,
                renderer_response: response.data,
                original_manim_code: manimCode, // Include the original code for debugging
                import_error: importError ? COMMON_IMPORT_FIXES[importError] : undefined
            });
        }
        // --- Handle Other Error Cases ---
        if (response.data?.error) {
            logger.error('Manim render service returned an error payload.', {
                status: response.status,
                responseData: response.data,
                sceneId
            });
            throw new AppError(`Manim rendering service failed: ${response.data.error}`, response.status || 502, true, {
                type: 'RENDERER_GENERIC_ERROR_PAYLOAD',
                status_code: response.status,
                renderer_response: response.data,
                original_manim_code: manimCode // Include the original code for debugging
            });
        }
        // Non-200 status without a specific error in data
        logger.error('Manim render service returned an unexpected non-200 status or invalid response.', {
            status: response.status,
            responseData: response.data,
            sceneId
        });
        throw new AppError('Manim rendering service returned an unexpected response.', response.status || 502, true, {
            type: 'RENDERER_UNEXPECTED_RESPONSE',
            status_code: response.status,
            renderer_response: response.data,
            original_manim_code: manimCode // Include the original code for debugging
        });
    }
    catch (error) {
        if (error instanceof AppError)
            throw error;
        // Handle Axios errors
        const axiosError = error;
        if (axiosError.isAxiosError) {
            const responseData = axiosError.response?.data;
            const serviceErrorMessage = responseData?.error || responseData?.details_stderr || responseData?.message || axiosError.message;
            const errorType = responseData?.type || (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT' ? 'TIMEOUT_ERROR' : 'AXIOS_SERVICE_ERROR');
            const statusCode = axiosError.response?.status || (errorType === 'TIMEOUT_ERROR' ? 504 : 502);
            logger.error(`Failed to render Manim scene ${sceneId}. Service Error: ${serviceErrorMessage}`, {
                error: axiosError,
                responseData,
                statusCode,
                errorType
            });
            throw new AppError(`Failed to render Manim scene ${sceneId}. Service Error: ${serviceErrorMessage}`, statusCode, true, {
                type: errorType,
                sceneId,
                renderer_response: responseData,
                axios_error_code: axiosError.code,
                original_manim_code: manimCode // Include the original code for debugging
            });
        }
        // Handle unknown errors
        logger.error(`Unexpected error in renderManimScene for scene ${sceneId}:`, error);
        throw new AppError('An unexpected error occurred while trying to render the Manim scene.', 500, false, {
            type: 'UNEXPECTED_MANIM_SERVICE_ERROR',
            sceneId: sceneId,
            originalError: error instanceof Error ? error.message : String(error),
            original_manim_code: manimCode // Include the original code for debugging
        });
    }
};
/**
 * Process a video with narration by generating TTS audio and merging it with the video
 * @param videoPath Path to the video file (could be a URL or local path)
 * @param narrationText Text to convert to speech
 * @param sceneId Unique identifier for the scene
 * @returns Path to the processed video file with narration
 */
async function processVideoWithNarration(videoPath, narrationText, sceneId) {
    try {
        logger.info(`Processing video with narration for scene ${sceneId}`);
        // 1. Generate narration audio using Eleven Labs (will be uploaded to cloud storage)
        const audioUrl = await generateNarrationAudio(narrationText, sceneId);
        // For cloud storage case, we'll just return both URLs separately
        // The front-end will handle playing the video with the audio
        if (videoPath.startsWith('http')) {
            logger.info(`Using cloud storage URLs for video and audio: video=${videoPath}, audio=${audioUrl}`);
            return videoPath;
        }
        // If it's a local path, we need to upload it to cloud storage
        const videoUrl = await uploadVideo(videoPath, sceneId);
        logger.info(`Uploaded video to cloud storage: ${videoUrl}`);
        return videoUrl;
    }
    catch (error) {
        logger.error(`Error processing video with narration for scene ${sceneId}:`, error);
        // If processing fails, just return the original video path
        if (videoPath.startsWith('http')) {
            return videoPath;
        }
        // Try to upload the original video to cloud storage as a fallback
        try {
            const videoUrl = await uploadVideo(videoPath, sceneId);
            logger.info(`Fallback: Uploaded original video to cloud storage: ${videoUrl}`);
            return videoUrl;
        }
        catch (uploadError) {
            logger.error(`Failed to upload original video to cloud storage:`, uploadError);
            return videoPath;
        }
    }
}
//# sourceMappingURL=manimservice.js.map