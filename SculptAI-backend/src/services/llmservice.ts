import {
  GoogleGenAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerationConfig,
  SafetySetting,
  Part
} from "@google/genai";
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';
import { IStoryboardScene, ILLMCodeGenerationParams } from '../types/projectTypes.js';
import { systemPromptForManimCode, errorRecoveryPromptForManimCode } from "./prompt.js";

// Initialize Google Generative AI client
let genAIInstance: GoogleGenAI;

if (!config.googleGenerativeAiApiKey) {
  const errorMessage = 'CRITICAL ERROR: GOOGLE_GENERATIVE_AI_API_KEY is not configured in .env! LLM Service will not function correctly.';
  logger.error(errorMessage);
  genAIInstance = new GoogleGenAI({ apiKey: "MISSING_OR_INVALID_API_KEY_CHECK_ENV" });
} else {
  genAIInstance = new GoogleGenAI({ apiKey: config.googleGenerativeAiApiKey });
}

const isValidStoryboardScene = (scene: any): scene is IStoryboardScene => {
  return typeof scene === 'object' && scene !== null &&
         typeof scene.scene_title === 'string' &&
         typeof scene.narration === 'string' &&
         typeof scene.visual_description === 'string';
};

/**
 * LLM Service - generateScriptAndStoryboard
 *
 * Takes a user's idea and uses Gemini to generate a structured storyboard.
 */
export const generateScriptAndStoryboard = async (userIdea: string): Promise<IStoryboardScene[]> => {
  if (!config.googleGenerativeAiApiKey || config.googleGenerativeAiApiKey === "MISSING_OR_INVALID_API_KEY_CHECK_ENV") {
    logger.error('Attempted to generate storyboard without a valid Gemini API Key.');
    throw new AppError('Gemini API Key is not configured. Cannot generate storyboard.', 500, false);
  }

  const modelName = config.llmModels.scripting;

  const promptForStoryboard = `
You are an expert instructional designer and scriptwriter.
Your task is to take the user's idea and generate a detailed, step-by-step explanatory script.
This script should be broken down into logical scenes. For each scene, provide:
1. A short "scene_title".
2. The "narration" script for that scene.
3. A brief "visual_description" of what should be animated or shown.
Focus on a logical flow that builds understanding.
Output MUST be a valid JSON array of objects, where each object represents a scene and has keys: "scene_title", "narration", "visual_description".
Do not include any text outside of this JSON array, no markdown formatting (like \`\`\`json), just the raw JSON array itself.

User Idea: "${userIdea}"

JSON Storyboard Output:
  `;

  logger.debug('Sending request to Gemini for storyboard generation.', { modelName, userIdeaLength: userIdea.length });

  try {
    const generationConfig: GenerationConfig = {
      temperature: 0.5,
      maxOutputTokens: 4096,
    };
    const safetySettings: SafetySetting[] = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];

    const generationParams = {
        model: modelName,
        contents: [{ role: "user", parts: [{text: promptForStoryboard}] as Part[] }],
        generationConfig,
        safetySettings,
    };

    const result = await genAIInstance.models.generateContent(generationParams);

    // Check for prompt-level blocking first
    if (result.promptFeedback?.blockReason) {
      logger.error('Gemini storyboard generation request was blocked by API.', {
        blockReason: result.promptFeedback.blockReason,
        safetyRatings: result.promptFeedback.safetyRatings
      });
      throw new AppError(`Storyboard generation failed: Content was blocked by the API (Reason: ${result.promptFeedback.blockReason}). Check safety ratings.`, 400, false);
    }

    const responseText = result.text?.trim();

    if (!responseText) {
      const candidate = result.candidates?.[0];
      const finishReason = candidate?.finishReason;
      logger.error('Gemini returned empty content for storyboard or content generation finished due to safety.', {
        finishReason,
        hasCandidate: !!candidate,
        safetyRatings: candidate?.safetyRatings,
      });
      if (finishReason === "SAFETY") {
        throw new AppError('Storyboard generation failed: Content was blocked by safety settings after generation.', 400, false);
      }
      throw new AppError(`Gemini returned empty content for storyboard (Finish Reason: ${finishReason || 'UNKNOWN'}).`, 500, false);
    }

    logger.debug('Gemini storyboard raw response:', responseText);

    let parsedStoryboard;
    try {
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      parsedStoryboard = jsonMatch && jsonMatch[1] ? JSON.parse(jsonMatch[1]) : JSON.parse(responseText);
    } catch (parseError) {
      logger.error('Failed to parse storyboard JSON from Gemini:', { responseText, parseError });
      throw new AppError('Failed to parse storyboard from Gemini. Ensure valid JSON output from LLM.', 500, false);
    }
    
    const storyboardArray = parsedStoryboard.storyboard || parsedStoryboard.scenes || parsedStoryboard;
    if (!Array.isArray(storyboardArray) || !storyboardArray.every(isValidStoryboardScene)) {
      logger.error('Parsed storyboard is not a valid array of scenes:', { storyboardArray });
      throw new AppError('Gemini did not return a valid storyboard array structure.', 500, false);
    }
    return storyboardArray as IStoryboardScene[];
  } catch (error: unknown) {
    if (error instanceof AppError) throw error;
    logger.error('Error generating script/storyboard from Gemini:', error);
    const detail = error instanceof Error ? error.message : 'Unknown Gemini API error';
    throw new AppError(`Failed to communicate with Gemini for storyboard: ${detail}`, 502);
  }
};

/**
 * LLM Service - generateManimCodeForScene
 *
 * Takes scene data and uses Gemini to generate Manim Python code.
 */
export const generateManimCodeForScene = async (params: {
  scene_title: string;
  narration: string;
  visual_description: string;
  scene_number: number;
  total_scenes: number;
  topic: string;
  previousSceneContext?: string;
}): Promise<string> => {
  if (!config.googleGenerativeAiApiKey || config.googleGenerativeAiApiKey === "MISSING_OR_INVALID_API_KEY_CHECK_ENV") {
    logger.error('Attempted to generate Manim code without a valid Gemini API Key.');
    throw new AppError('Gemini API Key is not configured. Cannot generate Manim code.', 500, false);
  }

  const { scene_title, narration, visual_description, scene_number, total_scenes, topic, previousSceneContext } = params;
  const modelName = config.llmModels.manimCode;

  // Enhanced prompt with better guidance for Manim v0.18.0 compatibility
  const promptForManimCode = `You are an expert Manim animator. Create Manim Community Edition v0.18.0 compatible Python code for this scene description:

Title: "${scene_title}"

This is scene ${scene_number} of ${total_scenes} in an explanation about "${topic}".
${previousSceneContext ? `Previous Scene Context (conceptual, re-declare elements if needed): "${previousSceneContext}"` : ''}
Narration for this scene: "${narration}"
Visual description for this scene: "${visual_description}"

CRITICAL REQUIREMENTS FOR MANIM v0.18.0:
1. Use proper imports for Manim v0.18.0. Import specific objects directly from manim:
   - from manim import Scene, VGroup, Square, MathTex, Text, etc.
   - from manim import WHITE, YELLOW, GREEN, BLUE, BLACK, RED
   - from manim import UP, DOWN, LEFT, RIGHT, ORIGIN
   - from manim import Create, Write, FadeIn, Transform, etc.
   - DO NOT use: from manim import * (import specific items needed)
   - DO NOT use: from manim.constants import BLACK (use 'from manim import BLACK' instead)
   - The rate_functions are in manim.utils.rate_functions, not manim.animation.rate_functions

2. For animations that require rate_functions:
   from manim.utils.rate_functions import ease_out_quad, linear, etc.

3. Scene Class Format:
   - Name your scene class exactly 'GeneratedScene'
   - Ensure it has a 'construct' method

4. Do not use HTML tags or formatted strings in text - escape quotes properly.

5. If you need to use constants like TOP, BOTTOM, RIGHT_SIDE, define them explicitly:
   _FRAME_Y_RADIUS = config.frame_y_radius if "config" in globals() and hasattr(config, "frame_y_radius") else 4.0
   _FRAME_X_RADIUS = config.frame_x_radius if "config" in globals() and hasattr(config, "frame_x_radius") else (16/9) * _FRAME_Y_RADIUS
   import numpy as np
   BOTTOM = np.array([0, -_FRAME_Y_RADIUS, 0])
   TOP = np.array([0, _FRAME_Y_RADIUS, 0])
   LEFT_SIDE = np.array([-_FRAME_X_RADIUS, 0, 0])
   RIGHT_SIDE = np.array([_FRAME_X_RADIUS, 0, 0])

Manim Python Code Output (Ensure ONLY the \\\`\\\`\\\`python ... \\\`\\\`\\\` block):
`;

  logger.debug(`Sending request to Gemini for Manim code (Scene ${scene_number}/${total_scenes})`, { modelName });

  try {
    const generationConfig: GenerationConfig = { temperature: 0.1, maxOutputTokens: 3072 };
    const safetySettings: SafetySetting[] = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];
    const generationParams = {
        model: modelName,
        contents: [{ role: "user", parts: [{text: promptForManimCode}] as Part[] }],
        generationConfig,
        safetySettings,
    };

    const result = await genAIInstance.models.generateContent(generationParams);

    if (result.promptFeedback?.blockReason) {
      logger.error(`Gemini Manim code generation for scene ${scene_number} was blocked by API.`, {
        blockReason: result.promptFeedback.blockReason,
        safetyRatings: result.promptFeedback.safetyRatings
      });
      throw new AppError(`Manim code generation for scene ${scene_number} failed: Content was blocked by the API (Reason: ${result.promptFeedback.blockReason}). Check safety ratings.`, 400, false);
    }

    let manimCode = result.text?.trim();

    if (!manimCode) {
      const candidate = result.candidates?.[0];
      const finishReason = candidate?.finishReason;
      logger.error(`Gemini returned empty content for Manim code for scene ${scene_number}.`, {
        finishReason,
        hasCandidate: !!candidate,
        safetyRatings: candidate?.safetyRatings,
      });
      if (finishReason === "SAFETY") {
        throw new AppError(`Manim code generation for scene ${scene_number} failed: Content was blocked by safety settings after generation.`, 400, false);
      }
      throw new AppError(`Gemini returned empty content for Manim code for scene ${scene_number} (Finish Reason: ${finishReason || 'UNKNOWN'}).`, 500, false);
    }

    const codeMatch = manimCode.match(/```python\s*([\s\S]*?)\s*```/);
    manimCode = codeMatch && codeMatch[1] ? codeMatch[1] : manimCode.trim();
    if (manimCode.startsWith("python\n")) {
        manimCode = manimCode.substring("python\n".length).trim();
    }

    if (!manimCode.includes("class GeneratedScene(Scene):") || !manimCode.includes("def construct(self):")) {
        logger.warn("Generated Manim code from Gemini might be malformed or incomplete.", { preview: manimCode.substring(0,200) });
    }

    logger.debug(`Generated Manim code by Gemini for Scene ${scene_number}: ${manimCode.substring(0, 100)}...`);
    return manimCode;
  } catch (error: unknown) {
    if (error instanceof AppError) throw error;
    logger.error(`Error generating Manim code from Gemini for scene ${params.scene_number}:`, error);
    const detail = error instanceof Error ? error.message : 'Unknown Gemini API error';
    throw new AppError(`Failed to communicate with Gemini for Manim code: ${detail}`, 502);
  }
};

/**
 * LLM Service - correctManimCodeWithLLM
 *
 * Takes erroneous Manim code and error details (from Flake8 or Manim runtime)
 * and uses Gemini to attempt a correction.
 */
export const correctManimCodeWithLLM = async (
    originalManimCode: string,
    errorDetails: any, // This will contain Flake8 output or Manim stderr
    sceneInfo: { scene_number: number; total_scenes: number; topic: string }
): Promise<string> => {
    if (!config.googleGenerativeAiApiKey || config.googleGenerativeAiApiKey === "MISSING_OR_INVALID_API_KEY_CHECK_ENV") {
        logger.error('Attempted to correct Manim code without a valid Gemini API Key.');
        throw new AppError('Gemini API Key is not configured. Cannot correct Manim code.', 500, false);
    }

    const modelName = config.llmModels.manimCode; // Use the same model as for generation, or a specific one for correction
    
    // Use the error recovery prompt from prompt.ts
    let correctionPrompt = errorRecoveryPromptForManimCode + `\n\nOriginal Manim Code with Errors:\n\`\`\`python\n${originalManimCode}\n\`\`\`\n\n`;

    // Adapt prompt based on error type
    if (errorDetails.type === 'LINTING_ERROR' && errorDetails.renderer_response?.details_stdout) {
        correctionPrompt += `Error Type: Linting Error (Flake8)\nError Details:\n\`\`\`\n${errorDetails.renderer_response.details_stdout}\n\`\`\``;
    } else if (errorDetails.type === 'MANIM_RUNTIME_ERROR' && errorDetails.renderer_response) {
        correctionPrompt += `Error Type: Runtime Error (Manim Execution)\nError Type: ${errorDetails.renderer_response.error_type || 'N/A'}\nParsed Error: ${errorDetails.renderer_response.parsed_error || 'N/A'}\nMANIM STDERR:\n\`\`\`\n${errorDetails.renderer_response.details_stderr || 'N/A'}\n\`\`\`\nMANIM STDOUT:\n\`\`\`\n${errorDetails.renderer_response.details_stdout || 'N/A'}\n\`\`\``;
    } else {
        // Generic fallback if error structure is unexpected
        correctionPrompt += `Error Type: Unknown\nError Details: ${JSON.stringify(errorDetails, null, 2)}`;
    }

    // Add context about the scene
    correctionPrompt += `\n\nAdditional Context:\n- Scene Number: ${sceneInfo.scene_number}\n- Total Scenes: ${sceneInfo.total_scenes}\n- Topic: "${sceneInfo.topic}"\n\nNow provide ONLY the fixed Python code:`;

    logger.debug(`Sending request to Gemini for Manim code correction (Scene ${sceneInfo.scene_number})`, { modelName });

    try {
        const generationConfig = { temperature: 0.15, maxOutputTokens: 3072 }; // Slightly higher temp for correction
        const safetySettings = [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        ];

        const generationParams = {
            model: modelName,
            contents: [{ role: "user", parts: [{ text: correctionPrompt }] }],
            generationConfig,
            safetySettings,
        };

        const result = await genAIInstance.models.generateContent(generationParams);

        if (result.promptFeedback?.blockReason) {
            logger.error(`Gemini Manim code correction for scene ${sceneInfo.scene_number} was blocked by API.`, {
                blockReason: result.promptFeedback.blockReason,
                safetyRatings: result.promptFeedback.safetyRatings
            });
            throw new AppError(`Manim code correction for scene ${sceneInfo.scene_number} failed: Content was blocked by the API (Reason: ${result.promptFeedback.blockReason}).`, 400, false);
        }

        let correctedManimCode = result.text?.trim();
        if (!correctedManimCode) {
            const candidate = result.candidates?.[0];
            const finishReason = candidate?.finishReason;
            logger.error(`Gemini returned empty content for Manim code correction for scene ${sceneInfo.scene_number}.`, {
                finishReason,
                hasCandidate: !!candidate,
                safetyRatings: candidate?.safetyRatings,
            });
            if (finishReason === "SAFETY") {
                throw new AppError(`Manim code correction for scene ${sceneInfo.scene_number} failed due to safety settings.`, 400, false);
            }
            throw new AppError(`Gemini returned empty content for Manim code correction for scene ${sceneInfo.scene_number} (Finish Reason: ${finishReason || 'UNKNOWN'}).`, 500, false);
        }

        const codeMatch = correctedManimCode.match(/```python\s*([\s\S]*?)\s*```/);
        correctedManimCode = codeMatch && codeMatch[1] ? codeMatch[1] : correctedManimCode.trim();
        if (correctedManimCode.startsWith("python\n")) {
            correctedManimCode = correctedManimCode.substring("python\n".length).trim();
        }

        // Basic validation of the corrected code
        if (!correctedManimCode.includes("class GeneratedScene(Scene):") || !correctedManimCode.includes("def construct(self):")) {
            logger.warn("Corrected Manim code from Gemini might be malformed or incomplete.", { preview: correctedManimCode.substring(0, 200) });
            // Do not throw an error here, let the next lint/render attempt catch it. The LLM might have just returned an explanation.
        }

        logger.debug(`Corrected Manim code by Gemini for Scene ${sceneInfo.scene_number}: ${correctedManimCode.substring(0, 100)}...`);
        return correctedManimCode;

    } catch (error: unknown) {
        if (error instanceof AppError) throw error;
        logger.error(`Error correcting Manim code from Gemini for scene ${sceneInfo.scene_number}:`, error);
        const detail = error instanceof Error ? error.message : 'Unknown Gemini API error during correction';
        throw new AppError(`Failed to communicate with Gemini for Manim code correction: ${detail}`, 502);
    }
};