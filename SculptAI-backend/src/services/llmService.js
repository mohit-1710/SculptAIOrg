"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateManimCodeForScene = exports.generateScriptAndStoryboard = void 0;
var genai_1 = require("@google/genai");
var index_js_1 = require("../config/index.js");
var logger_js_1 = require("../utils/logger.js");
var AppError_js_1 = require("../utils/AppError.js");
// Initialize Google Generative AI client
var genAIInstance;
if (!index_js_1.default.googleGenerativeAiApiKey) {
    var errorMessage = 'CRITICAL ERROR: GOOGLE_GENERATIVE_AI_API_KEY is not configured in .env! LLM Service will not function correctly.';
    logger_js_1.default.error(errorMessage);
    genAIInstance = new genai_1.GoogleGenAI({ apiKey: "MISSING_OR_INVALID_API_KEY_CHECK_ENV" });
}
else {
    genAIInstance = new genai_1.GoogleGenAI({ apiKey: index_js_1.default.googleGenerativeAiApiKey });
}
var isValidStoryboardScene = function (scene) {
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
var generateScriptAndStoryboard = function (userIdea) { return __awaiter(void 0, void 0, void 0, function () {
    var modelName, promptForStoryboard, generationConfig, safetySettings, generationParams, result, responseText, candidate, finishReason, parsedStoryboard, jsonMatch, storyboardArray, error_1, detail;
    var _a, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                if (!index_js_1.default.googleGenerativeAiApiKey || index_js_1.default.googleGenerativeAiApiKey === "MISSING_OR_INVALID_API_KEY_CHECK_ENV") {
                    logger_js_1.default.error('Attempted to generate storyboard without a valid Gemini API Key.');
                    throw new AppError_js_1.AppError('Gemini API Key is not configured. Cannot generate storyboard.', 500, false);
                }
                modelName = index_js_1.default.llmModels.scripting;
                promptForStoryboard = "\nYou are an expert instructional designer and scriptwriter.\nYour task is to take the user's idea and generate a detailed, step-by-step explanatory script.\nThis script should be broken down into logical scenes. For each scene, provide:\n1. A short \"scene_title\".\n2. The \"narration\" script for that scene.\n3. A brief \"visual_description\" of what should be animated or shown.\nFocus on a logical flow that builds understanding.\nOutput MUST be a valid JSON array of objects, where each object represents a scene and has keys: \"scene_title\", \"narration\", \"visual_description\".\nDo not include any text outside of this JSON array, no markdown formatting (like ```json), just the raw JSON array itself.\n\nUser Idea: \"".concat(userIdea, "\"\n\nJSON Storyboard Output:\n  ");
                logger_js_1.default.debug('Sending request to Gemini for storyboard generation.', { modelName: modelName, userIdeaLength: userIdea.length });
                _d.label = 1;
            case 1:
                _d.trys.push([1, 3, , 4]);
                generationConfig = {
                    temperature: 0.5,
                    maxOutputTokens: 4096,
                };
                safetySettings = [
                    { category: genai_1.HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: genai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    { category: genai_1.HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: genai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    { category: genai_1.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: genai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    { category: genai_1.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: genai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                ];
                generationParams = {
                    model: modelName,
                    contents: [{ role: "user", parts: [{ text: promptForStoryboard }] }],
                    generationConfig: generationConfig,
                    safetySettings: safetySettings,
                };
                return [4 /*yield*/, genAIInstance.models.generateContent(generationParams)];
            case 2:
                result = _d.sent();
                // Check for prompt-level blocking first
                if ((_a = result.promptFeedback) === null || _a === void 0 ? void 0 : _a.blockReason) {
                    logger_js_1.default.error('Gemini storyboard generation request was blocked by API.', {
                        blockReason: result.promptFeedback.blockReason,
                        safetyRatings: result.promptFeedback.safetyRatings
                    });
                    throw new AppError_js_1.AppError("Storyboard generation failed: Content was blocked by the API (Reason: ".concat(result.promptFeedback.blockReason, "). Check safety ratings."), 400, false);
                }
                responseText = (_b = result.text) === null || _b === void 0 ? void 0 : _b.trim();
                if (!responseText) {
                    candidate = (_c = result.candidates) === null || _c === void 0 ? void 0 : _c[0];
                    finishReason = candidate === null || candidate === void 0 ? void 0 : candidate.finishReason;
                    logger_js_1.default.error('Gemini returned empty content for storyboard or content generation finished due to safety.', {
                        finishReason: finishReason,
                        hasCandidate: !!candidate,
                        safetyRatings: candidate === null || candidate === void 0 ? void 0 : candidate.safetyRatings,
                    });
                    if (finishReason === "SAFETY") {
                        throw new AppError_js_1.AppError('Storyboard generation failed: Content was blocked by safety settings after generation.', 400, false);
                    }
                    throw new AppError_js_1.AppError("Gemini returned empty content for storyboard (Finish Reason: ".concat(finishReason || 'UNKNOWN', ")."), 500, false);
                }
                logger_js_1.default.debug('Gemini storyboard raw response:', responseText);
                parsedStoryboard = void 0;
                try {
                    jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
                    parsedStoryboard = jsonMatch && jsonMatch[1] ? JSON.parse(jsonMatch[1]) : JSON.parse(responseText);
                }
                catch (parseError) {
                    logger_js_1.default.error('Failed to parse storyboard JSON from Gemini:', { responseText: responseText, parseError: parseError });
                    throw new AppError_js_1.AppError('Failed to parse storyboard from Gemini. Ensure valid JSON output from LLM.', 500, false);
                }
                storyboardArray = parsedStoryboard.storyboard || parsedStoryboard.scenes || parsedStoryboard;
                if (!Array.isArray(storyboardArray) || !storyboardArray.every(isValidStoryboardScene)) {
                    logger_js_1.default.error('Parsed storyboard is not a valid array of scenes:', { storyboardArray: storyboardArray });
                    throw new AppError_js_1.AppError('Gemini did not return a valid storyboard array structure.', 500, false);
                }
                return [2 /*return*/, storyboardArray];
            case 3:
                error_1 = _d.sent();
                if (error_1 instanceof AppError_js_1.AppError)
                    throw error_1;
                logger_js_1.default.error('Error generating script/storyboard from Gemini:', error_1);
                detail = error_1.message || 'Unknown Gemini API error';
                throw new AppError_js_1.AppError("Failed to communicate with Gemini for storyboard: ".concat(detail), 502);
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.generateScriptAndStoryboard = generateScriptAndStoryboard;
/**
 * LLM Service - generateManimCodeForScene
 *
 * Takes scene data and uses Gemini to generate Manim Python code.
 */
var generateManimCodeForScene = function (params) { return __awaiter(void 0, void 0, void 0, function () {
    var modelName, narration, visual_description, scene_number, total_scenes, topic, previousSceneContext, promptForManimCode, generationConfig, safetySettings, generationParams, result, manimCode, candidate, finishReason, codeMatch, error_2, detail;
    var _a, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                if (!index_js_1.default.googleGenerativeAiApiKey || index_js_1.default.googleGenerativeAiApiKey === "MISSING_OR_INVALID_API_KEY_CHECK_ENV") {
                    logger_js_1.default.error('Attempted to generate Manim code without a valid Gemini API Key.');
                    throw new AppError_js_1.AppError('Gemini API Key is not configured. Cannot generate Manim code.', 500, false);
                }
                modelName = index_js_1.default.llmModels.manimCode;
                narration = params.narration, visual_description = params.visual_description, scene_number = params.scene_number, total_scenes = params.total_scenes, topic = params.topic, previousSceneContext = params.previousSceneContext;
                promptForManimCode = "\nYou are an expert Manim Community Edition programmer.\nYour task is to generate a complete Manim Python script for a single scene based on the provided narration and visual description.\nThe Manim scene class MUST be named 'GeneratedScene'.\nInclude all necessary imports (e.g., 'from manim import *').\nThe animation should be short (target 3-7 seconds), visually clear, and directly support the narration and visual description.\nOutput ONLY the Python code block, starting with ```python and ending with ```. Do not include any other explanations or surrounding text.\nIf elements from a *conceptual* previous scene are needed, re-declare them in this current scene. Assume each scene is rendered independently.\n\n--- FEW-SHOT EXAMPLES ---\nEXAMPLE 1:\nUser Input Context:\n  Narration: \"First, a red circle appears.\"\n  Visual Description: \"Show a red circle appearing in the center.\"\n  Topic: \"Shapes\"\nExpected Model Output (Manim Code):\n```python\nfrom manim import *\nclass GeneratedScene(Scene):\n    def construct(self):\n        red_circle = Circle(color=RED)\n        self.play(Create(red_circle))\n        self.wait(1)\n```\n--- END FEW-SHOT EXAMPLES ---\n\nCurrent Scene Task:\nThis is scene ".concat(scene_number, " of ").concat(total_scenes, " in an explanation about \"").concat(topic, "\".\n").concat(previousSceneContext ? "Context from previous conceptual scene: \"".concat(previousSceneContext, "\"") : '', "\nNarration for this scene: \"").concat(narration, "\"\nVisual description for this scene: \"").concat(visual_description, "\"\n\nManim Python Code Output (Only the code block):\n");
                logger_js_1.default.debug("Sending request to Gemini for Manim code (Scene ".concat(scene_number, "/").concat(total_scenes, ")"), { modelName: modelName });
                _d.label = 1;
            case 1:
                _d.trys.push([1, 3, , 4]);
                generationConfig = { temperature: 0.1, maxOutputTokens: 3072 };
                safetySettings = [
                    { category: genai_1.HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: genai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    { category: genai_1.HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: genai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    { category: genai_1.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: genai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    { category: genai_1.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: genai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                ];
                generationParams = {
                    model: modelName,
                    contents: [{ role: "user", parts: [{ text: promptForManimCode }] }],
                    generationConfig: generationConfig,
                    safetySettings: safetySettings,
                };
                return [4 /*yield*/, genAIInstance.models.generateContent(generationParams)];
            case 2:
                result = _d.sent();
                if ((_a = result.promptFeedback) === null || _a === void 0 ? void 0 : _a.blockReason) {
                    logger_js_1.default.error("Gemini Manim code generation for scene ".concat(scene_number, " was blocked by API."), {
                        blockReason: result.promptFeedback.blockReason,
                        safetyRatings: result.promptFeedback.safetyRatings
                    });
                    throw new AppError_js_1.AppError("Manim code generation for scene ".concat(scene_number, " failed: Content was blocked by the API (Reason: ").concat(result.promptFeedback.blockReason, "). Check safety ratings."), 400, false);
                }
                manimCode = (_b = result.text) === null || _b === void 0 ? void 0 : _b.trim();
                if (!manimCode) {
                    candidate = (_c = result.candidates) === null || _c === void 0 ? void 0 : _c[0];
                    finishReason = candidate === null || candidate === void 0 ? void 0 : candidate.finishReason;
                    logger_js_1.default.error("Gemini returned empty content for Manim code for scene ".concat(scene_number, "."), {
                        finishReason: finishReason,
                        hasCandidate: !!candidate,
                        safetyRatings: candidate === null || candidate === void 0 ? void 0 : candidate.safetyRatings,
                    });
                    if (finishReason === "SAFETY") {
                        throw new AppError_js_1.AppError("Manim code generation for scene ".concat(scene_number, " failed: Content was blocked by safety settings after generation."), 400, false);
                    }
                    throw new AppError_js_1.AppError("Gemini returned empty content for Manim code for scene ".concat(scene_number, " (Finish Reason: ").concat(finishReason || 'UNKNOWN', ")."), 500, false);
                }
                codeMatch = manimCode.match(/```python\s*([\s\S]*?)\s*```/);
                manimCode = codeMatch && codeMatch[1] ? codeMatch[1] : manimCode.trim();
                if (manimCode.startsWith("python\n")) {
                    manimCode = manimCode.substring("python\n".length).trim();
                }
                if (!manimCode.includes("class GeneratedScene(Scene):") || !manimCode.includes("def construct(self):")) {
                    logger_js_1.default.warn("Generated Manim code from Gemini might be malformed or incomplete.", { preview: manimCode.substring(0, 200) });
                }
                logger_js_1.default.debug("Generated Manim code by Gemini for Scene ".concat(scene_number, ": ").concat(manimCode.substring(0, 100), "..."));
                return [2 /*return*/, manimCode];
            case 3:
                error_2 = _d.sent();
                if (error_2 instanceof AppError_js_1.AppError)
                    throw error_2;
                logger_js_1.default.error("Error generating Manim code from Gemini for scene ".concat(scene_number, ":"), error_2);
                detail = error_2.message || 'Unknown Gemini API error';
                throw new AppError_js_1.AppError("Failed to communicate with Gemini for Manim code: ".concat(detail), 502);
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.generateManimCodeForScene = generateManimCodeForScene;
