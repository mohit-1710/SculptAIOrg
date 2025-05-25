import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';

// Initialize Google Cloud Storage client
let storage;
let bucket;

try {
    const { projectId, keyFilename, bucketName } = config.storage.googleCloud;
    
    if (!projectId || !bucketName) {
        logger.warn('Google Cloud Storage configuration incomplete. Some features may not work correctly.');
    }
    
    storage = new Storage({
        projectId,
        keyFilename: keyFilename || undefined
    });
    
    bucket = bucketName;
    
    logger.info(`Google Cloud Storage initialized with bucket: ${bucket}`);
} catch (error) {
    logger.error('Failed to initialize Google Cloud Storage:', error);
}

/**
 * Get a publicly accessible URL for a file in Google Cloud Storage
 * @param filename The name of the file
 * @returns The public URL
 */
export const getPublicUrl = (filename) => {
    return `${config.storage.googleCloud.baseUrl}/${filename}`;
};

/**
 * Uploads a file to Google Cloud Storage
 * @param localFilePath The local path to the file
 * @param destinationFileName The name to save the file as in the bucket
 * @returns The public URL of the uploaded file
 */
export const uploadFile = async (localFilePath, destinationFileName) => {
    try {
        if (!storage || !bucket) {
            throw new AppError('Google Cloud Storage is not properly configured', 500, false);
        }

        logger.info(`Uploading file ${localFilePath} to Google Cloud Storage as ${destinationFileName}`);
        
        // Check if the file exists
        if (!fs.existsSync(localFilePath)) {
            throw new AppError(`File not found: ${localFilePath}`, 404, false);
        }
        
        // Upload the file to Google Cloud Storage
        await storage.bucket(bucket).upload(localFilePath, {
            destination: destinationFileName,
            metadata: {
                cacheControl: 'public, max-age=31536000', // Cache for 1 year
            },
            public: true, // Make the file publicly accessible
        });
        
        logger.info(`File uploaded successfully to Google Cloud Storage: ${destinationFileName}`);
        
        // Return the public URL
        return getPublicUrl(destinationFileName);
    } catch (error) {
        logger.error(`Error uploading file to Google Cloud Storage: ${error instanceof Error ? error.message : String(error)}`);
        throw new AppError(
            `Failed to upload file to cloud storage: ${error instanceof Error ? error.message : String(error)}`,
            500,
            false
        );
    }
};

/**
 * Uploads a video file to Google Cloud Storage
 * @param localFilePath The local path to the video file
 * @param sceneId The ID of the scene (used for generating the filename)
 * @returns The public URL of the uploaded video
 */
export const uploadVideo = async (localFilePath, sceneId) => {
    // Generate a unique filename based on the scene ID
    const fileExtension = path.extname(localFilePath);
    const timestamp = Date.now();
    const hash = createHash('md5').update(`${sceneId}-${timestamp}`).digest('hex').substring(0, 8);
    const destinationFileName = `videos/${sceneId}-${hash}${fileExtension}`;
    
    return await uploadFile(localFilePath, destinationFileName);
};

/**
 * Uploads an audio file to Google Cloud Storage
 * @param localFilePath The local path to the audio file
 * @param sceneId The ID of the scene (used for generating the filename)
 * @returns The public URL of the uploaded audio
 */
export const uploadAudio = async (localFilePath, sceneId) => {
    // Generate a unique filename based on the scene ID
    const fileExtension = path.extname(localFilePath);
    const timestamp = Date.now();
    const hash = createHash('md5').update(`${sceneId}-${timestamp}`).digest('hex').substring(0, 8);
    const destinationFileName = `audio/${sceneId}-${hash}${fileExtension}`;
    
    return await uploadFile(localFilePath, destinationFileName);
};

/**
 * Deletes a file from Google Cloud Storage
 * @param fileUrl The URL of the file to delete
 * @returns True if successful, false otherwise
 */
export const deleteFile = async (fileUrl) => {
    try {
        if (!storage || !bucket) {
            throw new AppError('Google Cloud Storage is not properly configured', 500, false);
        }

        // Extract the filename from the URL
        const baseUrl = config.storage.googleCloud.baseUrl;
        if (!fileUrl.startsWith(baseUrl)) {
            logger.warn(`Cannot delete file with URL ${fileUrl} - not a Google Cloud Storage URL`);
            return false;
        }
        
        const filename = fileUrl.substring(baseUrl.length + 1); // +1 for the trailing slash
        
        logger.info(`Deleting file ${filename} from Google Cloud Storage`);
        
        // Delete the file
        await storage.bucket(bucket).file(filename).delete();
        
        logger.info(`File deleted successfully from Google Cloud Storage: ${filename}`);
        
        return true;
    } catch (error) {
        logger.error(`Error deleting file from Google Cloud Storage: ${error instanceof Error ? error.message : String(error)}`);
        return false;
    }
}; 