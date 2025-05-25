import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import { createRequire } from 'module';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';
import { uploadAudio } from './storageService.js';
// Import elevenlabs-node using createRequire for CommonJS modules in ES modules
const require = createRequire(import.meta.url);
// @ts-ignore
const ElevenLabs = require('elevenlabs-node');
// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath.path);
// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Check if Eleven Labs API key is configured
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const DEFAULT_VOICE_ID = process.env.ELEVENLABS_DEFAULT_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // Default to "Rachel" voice
// Initialize Eleven Labs client if API key is available
let elevenLabsClient = null;
if (ELEVENLABS_API_KEY) {
    elevenLabsClient = new ElevenLabs({
        apiKey: ELEVENLABS_API_KEY,
        voiceId: DEFAULT_VOICE_ID
    });
}
else {
    logger.warn('ELEVENLABS_API_KEY is not configured. TTS will not be available.');
}
/**
 * Generate TTS audio from text using Eleven Labs
 * @param text The text to convert to speech
 * @param sceneId Unique identifier for the scene
 * @returns Path to the generated audio file
 */
export const generateNarrationAudio = async (text, sceneId) => {
    if (!elevenLabsClient) {
        throw new AppError('Eleven Labs API key is not configured. Cannot generate TTS.', 500, false);
    }
    try {
        logger.info(`Generating TTS audio for scene ${sceneId}`);
        logger.debug(`TTS text content (first 100 chars): "${text.substring(0, 100)}..."`);
        logger.debug(`Using Eleven Labs API key: ${ELEVENLABS_API_KEY ? 'Available' : 'Not available'}`);
        logger.debug(`Using voice ID: ${DEFAULT_VOICE_ID}`);
        // Define paths
        const outputDir = config.manimRenderService.outputDir;
        const audioFileName = `${sceneId}_narration.mp3`;
        const audioFilePath = path.join(outputDir, audioFileName);
        logger.debug(`Output directory: ${outputDir}`);
        logger.debug(`Audio file path: ${audioFilePath}`);
        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
            logger.debug(`Creating output directory: ${outputDir}`);
            fs.mkdirSync(outputDir, { recursive: true });
        }
        // Generate TTS with Eleven Labs
        logger.debug(`Calling Eleven Labs API to generate TTS...`);
        const result = await elevenLabsClient.textToSpeech({
            textInput: text,
            fileName: audioFilePath,
            voiceId: DEFAULT_VOICE_ID,
            stability: 0.5,
            similarityBoost: 0.75,
        });
        if (result && result.code !== 200) {
            logger.error(`Failed to generate TTS, API returned code ${result.code}: ${result.message}`);
            throw new Error(`Failed to generate TTS: ${result.message}`);
        }
        logger.info(`Generated TTS audio saved to ${audioFilePath}`);
        logger.debug(`Audio file exists: ${fs.existsSync(audioFilePath)}`);
        
        // Upload the audio file to Google Cloud Storage
        const audioUrl = await uploadAudio(audioFilePath, sceneId);
        logger.info(`Audio file uploaded to Google Cloud Storage: ${audioUrl}`);
        
        // Return the full URL for the audio file
        return audioUrl;
    }
    catch (error) {
        logger.error(`Error generating TTS for scene ${sceneId}:`, error);
        throw new AppError(`Failed to generate TTS audio: ${error instanceof Error ? error.message : String(error)}`, 500, false);
    }
};
/**
 * Merge video and audio files using FFmpeg
 * @param videoPath Path to the video file
 * @param audioPath Path to the audio file
 * @param outputFilename Filename for the merged output
 * @returns Path to the merged video file
 */
export const mergeVideoWithAudio = async (videoPath, audioPath, outputFilename) => {
    try {
        const outputDir = config.manimRenderService.outputDir;
        const outputPath = path.join(outputDir, outputFilename);
        logger.info(`Merging video ${videoPath} with audio ${audioPath}`);
        logger.debug(`Video path exists: ${fs.existsSync(videoPath)}`);
        logger.debug(`Audio path exists: ${fs.existsSync(audioPath)}`);
        logger.debug(`Output path: ${outputPath}`);
        return new Promise((resolve, reject) => {
            // Get video duration
            logger.debug(`Getting video metadata...`);
            ffmpeg.ffprobe(videoPath, (videoErr, videoMetadata) => {
                if (videoErr) {
                    logger.error('Error getting video metadata:', videoErr);
                    return reject(new AppError(`Failed to get video metadata: ${videoErr.message}`, 500, false));
                }
                // Get audio duration
                ffmpeg.ffprobe(audioPath, (audioErr, audioMetadata) => {
                    if (audioErr) {
                        logger.error('Error getting audio metadata:', audioErr);
                        return reject(new AppError(`Failed to get audio metadata: ${audioErr.message}`, 500, false));
                    }
                    const videoDuration = videoMetadata.format.duration || 0;
                    const audioDuration = audioMetadata.format.duration || 0;
                    logger.info(`Video duration: ${videoDuration}s, Audio duration: ${audioDuration}s`);
                    // If audio is longer than video, extend the video duration
                    const command = ffmpeg();
                    if (audioDuration > videoDuration) {
                        logger.info(`Extending video duration to match audio (${audioDuration}s)`);
                        // Create a command that extends the video by freezing the last frame
                        command
                            .input(videoPath)
                            .inputOptions(['-stream_loop 1']) // Loop the video if needed
                            .input(audioPath)
                            .outputOptions([
                            '-c:v libx264',
                            '-c:a aac',
                            '-map 0:v',
                            '-map 1:a',
                            '-shortest', // End when the shortest input ends (audio in this case)
                            '-pix_fmt yuv420p', // Ensure compatibility
                        ])
                            .output(outputPath)
                            .on('end', () => {
                            logger.info(`Successfully merged video and audio to ${outputPath}`);
                            resolve(outputFilename);
                        })
                            .on('error', (err) => {
                            logger.error('Error merging video and audio:', err);
                            reject(new AppError(`Failed to merge video and audio: ${err.message}`, 500, false));
                        })
                            .run();
                    }
                    else {
                        // Standard merge if video is longer or same duration as audio
                        command
                            .input(videoPath)
                            .input(audioPath)
                            .outputOptions([
                            '-c:v copy',
                            '-c:a aac',
                            '-map 0:v',
                            '-map 1:a',
                            '-shortest', // End when the shortest input ends
                        ])
                            .output(outputPath)
                            .on('end', () => {
                            logger.info(`Successfully merged video and audio to ${outputPath}`);
                            resolve(outputFilename);
                        })
                            .on('error', (err) => {
                            logger.error('Error merging video and audio:', err);
                            reject(new AppError(`Failed to merge video and audio: ${err.message}`, 500, false));
                        })
                            .run();
                    }
                });
            });
        });
    }
    catch (error) {
        logger.error('Error in mergeVideoWithAudio:', error);
        throw new AppError(`Failed to merge video with audio: ${error instanceof Error ? error.message : String(error)}`, 500, false);
    }
};
//# sourceMappingURL=ttsService.js.map