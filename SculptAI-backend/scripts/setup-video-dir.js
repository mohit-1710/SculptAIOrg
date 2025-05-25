/**
 * Setup Video Directory Script
 * 
 * This script creates the directory for storing Manim-generated videos
 * and copies a test video to it for verifying the setup.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Try to load config from .env file
const envPath = path.join(projectRoot, '.env');
let outputDir = '/manim-videos'; // Default value

try {
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const outputDirMatch = envContent.match(/MANIM_OUTPUT_DIR=(.+)/);
    
    if (outputDirMatch && outputDirMatch[1]) {
      outputDir = outputDirMatch[1].trim();
      console.log(`Found output directory in .env: ${outputDir}`);
    }
  } else {
    console.log('.env file not found, using default output directory');
  }
} catch (error) {
  console.error('Error reading .env file:', error);
}

// Resolve output directory path
const videoDirPath = path.isAbsolute(outputDir)
  ? outputDir
  : path.join(projectRoot, outputDir);

console.log(`Setting up video directory at: ${videoDirPath}`);

// Create the directory if it doesn't exist
try {
  if (!fs.existsSync(videoDirPath)) {
    fs.mkdirSync(videoDirPath, { recursive: true });
    console.log(`Created directory: ${videoDirPath}`);
  } else {
    console.log(`Directory already exists: ${videoDirPath}`);
  }

  // Create a test text file to verify directory permissions
  const testFilePath = path.join(videoDirPath, 'test-access.txt');
  fs.writeFileSync(testFilePath, 'This file was created to test write access to the video directory.');
  console.log(`Created test file: ${testFilePath}`);
  
  console.log('✅ Video directory is set up and writable!');
  console.log('\nNext steps:');
  console.log('1. Place a test video in this directory (e.g., a .mp4 file)');
  console.log('2. Start the backend server');
  console.log('3. Try accessing http://localhost:5000/videos/your-video-file.mp4 in your browser');
  console.log('4. If the video plays, static file serving is configured correctly!');
  
} catch (error) {
  console.error('❌ Error setting up video directory:', error);
  console.log('\nPossible issues:');
  console.log('- Insufficient permissions to create/write to the directory');
  console.log('- Path specified in MANIM_OUTPUT_DIR is invalid');
  console.log('- Disk space issues');
  console.log('\nPlease resolve these issues and try again.');
} 