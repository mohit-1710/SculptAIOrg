/**
 * Setup Eleven Labs Integration Script
 * 
 * This script provides guidance on setting up Eleven Labs TTS integration for SculptAI.
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as readline from 'readline';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

console.log(`
${colors.bright}${colors.cyan}==============================================
        ELEVEN LABS TTS SETUP GUIDE
==============================================
${colors.reset}

This script will help you set up Eleven Labs text-to-speech integration
for adding narration to your SculptAI videos.

${colors.yellow}Steps to obtain an Eleven Labs API key:${colors.reset}

1. Create an account at ${colors.blue}https://elevenlabs.io/${colors.reset}
2. After logging in, go to your profile settings
3. Navigate to the API tab
4. Copy your API key
`);

// Function to update .env file
const updateEnvFile = (apiKey, voiceId) => {
  const envPath = path.join(projectRoot, '.env');
  
  try {
    let envContent = '';
    
    // Read existing .env file if it exists
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      
      // Remove any existing Eleven Labs settings
      envContent = envContent
        .replace(/\nELEVENLABS_API_KEY=.*\n/g, '\n')
        .replace(/\nELEVENLABS_DEFAULT_VOICE_ID=.*\n/g, '\n');
    }
    
    // Add Eleven Labs settings
    const elevenLabsSettings = `
# Eleven Labs TTS Configuration
ELEVENLABS_API_KEY=${apiKey}
ELEVENLABS_DEFAULT_VOICE_ID=${voiceId || 'EXAVITQu4vr4xnSDxMaL'}
`;

    // Append to .env file
    fs.writeFileSync(envPath, envContent + elevenLabsSettings);
    console.log(`\n${colors.green}Successfully updated .env file with Eleven Labs settings!${colors.reset}`);
  } catch (error) {
    console.error(`\n${colors.red}Error updating .env file: ${error.message}${colors.reset}`);
    console.log(`\nPlease manually add the following to your .env file:${elevenLabsSettings}`);
  }
};

// Function to check if an API key is valid format (not making actual API call)
const isValidApiKeyFormat = (apiKey) => {
  // Basic validation - Eleven Labs keys are typically 32 characters
  return apiKey && apiKey.length >= 32;
};

// Prompt for API key
rl.question(`\n${colors.bright}Enter your Eleven Labs API key:${colors.reset} `, (apiKey) => {
  if (!isValidApiKeyFormat(apiKey)) {
    console.log(`\n${colors.red}Warning: The API key format doesn't look valid. Please check it.${colors.reset}`);
    
    rl.question(`\n${colors.yellow}Continue anyway? (y/n):${colors.reset} `, (answer) => {
      if (answer.toLowerCase() !== 'y') {
        console.log(`\n${colors.yellow}Setup canceled. Please try again with a valid API key.${colors.reset}`);
        rl.close();
        return;
      }
      
      promptVoiceId(apiKey);
    });
  } else {
    promptVoiceId(apiKey);
  }
});

// Prompt for voice ID
const promptVoiceId = (apiKey) => {
  console.log(`
${colors.yellow}Available Eleven Labs Voice Options:${colors.reset}
- Rachel (female, default): ${colors.cyan}EXAVITQu4vr4xnSDxMaL${colors.reset}
- Adam (male): ${colors.cyan}pNInz6obpgDQGcFmaJgB${colors.reset}
- Domi (female): ${colors.cyan}AZnzlk1XvdvUeBnXmlld${colors.reset}
- Bella (female): ${colors.cyan}EbRarpoiU0AqjAaKpZA4${colors.reset}
- Antoni (male): ${colors.cyan}ErXwobaYiN019PkySvjV${colors.reset}

You can find more voice IDs at ${colors.blue}https://api.elevenlabs.io/v1/voices${colors.reset}
`);
  
  rl.question(`${colors.bright}Enter voice ID (or press Enter for default Rachel voice):${colors.reset} `, (voiceId) => {
    // Use default if none provided
    const selectedVoiceId = voiceId.trim() || 'EXAVITQu4vr4xnSDxMaL';
    
    updateEnvFile(apiKey, selectedVoiceId);
    
    console.log(`
${colors.green}${colors.bright}Setup Complete!${colors.reset}

${colors.yellow}Next steps:${colors.reset}
1. Restart your SculptAI backend server
2. Create a new animation - narration will be automatically added to your videos

${colors.cyan}Happy animating with narration!${colors.reset}
`);
    
    rl.close();
  });
}; 