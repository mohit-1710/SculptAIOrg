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
import { systemPromptForManimCode } from "./prompt.js";

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
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    logger.error('Error generating script/storyboard from Gemini:', error);
    const detail = error.message || 'Unknown Gemini API error';
    throw new AppError(`Failed to communicate with Gemini for storyboard: ${detail}`, 502);
  }
};

/**
 * LLM Service - generateManimCodeForScene
 *
 * Takes scene data and uses Gemini to generate Manim Python code.
 */
export const generateManimCodeForScene = async (params: ILLMCodeGenerationParams): Promise<string> => {
  if (!config.googleGenerativeAiApiKey || config.googleGenerativeAiApiKey === "MISSING_OR_INVALID_API_KEY_CHECK_ENV") {
    logger.error('Attempted to generate Manim code without a valid Gemini API Key.');
    throw new AppError('Gemini API Key is not configured. Cannot generate Manim code.', 500, false);
  }

  const modelName = config.llmModels.manimCode;
  const { narration, visual_description, scene_number, total_scenes, topic, previousSceneContext } = params;

const promptForManimCode = ` ${systemPromptForManimCode}

**Current Scene Task:**
This is scene ${scene_number} of ${total_scenes} in an explanation about "${topic}".
${previousSceneContext ? `Previous Scene Context (conceptual, re-declare elements if needed): "${previousSceneContext}"` : ''}
Narration for this scene: "${narration}"
Visual description for this scene: "${visual_description}"

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
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    logger.error(`Error generating Manim code from Gemini for scene ${scene_number}:`, error);
    const detail = error.message || 'Unknown Gemini API error';
    throw new AppError(`Failed to communicate with Gemini for Manim code: ${detail}`, 502);
  }
};