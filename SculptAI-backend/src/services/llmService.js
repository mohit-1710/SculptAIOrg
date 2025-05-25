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
var prompt_js_1 = require("../utils/prompt.js");
var gemini_1 = require("../utils/gemini.js");
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
var generateScriptAndStoryboard = function (userIdea) {
    return __awaiter(void 0, void 0, void 0, function () {
        var model, prompt, response, responseText, parsedStoryboard, jsonMatch, storyboardArray, error_1, detail;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (!index_js_1.default.googleGenerativeAiApiKey || index_js_1.default.googleGenerativeAiApiKey === "MISSING_OR_INVALID_API_KEY_CHECK_ENV") {
                        logger_js_1.default.error('Attempted to generate storyboard without a valid Gemini API Key.');
                        throw new AppError_js_1.AppError('Gemini API Key is not configured. Cannot generate storyboard.', 500, false);
                    }
                    model = index_js_1.default.llmModels.storyboard;
                    prompt = prompt_js_1.generateStoryboardPrompt(userIdea);
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 3, , 4]);
                    return [4, (0, gemini_1.generateFromGemini)(model, prompt)];
                case 2:
                    response = _d.sent();
                    responseText = response.text();
                    parsedStoryboard = void 0;
                    try {
                        jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
                        parsedStoryboard = jsonMatch && jsonMatch[1] ? JSON.parse(jsonMatch[1]) : JSON.parse(responseText);
                    }
                    catch (parseError) {
                        logger_js_1.default.error('Failed to parse storyboard JSON from Gemini:', {
                            responseText: responseText,
                            parseError: parseError instanceof Error ? parseError.message : String(parseError)
                        });
                        throw new AppError_js_1.AppError('Failed to parse storyboard from Gemini. Ensure valid JSON output from LLM.', 500, false, {
                            responseText: responseText,
                            parseError: parseError instanceof Error ? parseError.message : String(parseError)
                        });
                    }
                    storyboardArray = parsedStoryboard.storyboard || parsedStoryboard.scenes || parsedStoryboard;
                    if (!Array.isArray(storyboardArray) || !storyboardArray.every(isValidStoryboardScene)) {
                        logger_js_1.default.error('Parsed storyboard is not a valid array of scenes:', {
                            storyboardArray: storyboardArray
                        });
                        throw new AppError_js_1.AppError('Gemini did not return a valid storyboard array structure.', 500, false, {
                            storyboardArray: storyboardArray
                        });
                    }
                    return [2, storyboardArray];
                case 3:
                    error_1 = _d.sent();
                    if (error_1 instanceof AppError_js_1.AppError)
                        throw error_1;
                    logger_js_1.default.error('Error generating script/storyboard from Gemini:', {
                        error: error_1 instanceof Error ? error_1.message : String(error_1)
                    });
                    detail = error_1 instanceof Error ? error_1.message : 'Unknown Gemini API error';
                    throw new AppError_js_1.AppError("Failed to communicate with Gemini for storyboard: ".concat(detail), 502, false, {
                        originalError: error_1 instanceof Error ? error_1.message : String(error_1)
                    });
                case 4:
                    return [2];
            }
        });
    });
};
exports.generateScriptAndStoryboard = generateScriptAndStoryboard;
/**
 * LLM Service - generateManimCodeForScene
 *
 * Takes scene data and uses Gemini to generate Manim Python code.
 */
var generateManimCodeForScene = function (params) {
    return __awaiter(void 0, void 0, void 0, function () {
        var modelName, narration, visual_description, scene_number, total_scenes, topic, previousSceneContext, promptForManimCode, response, manimCode, codeMatch, error_2, detail;
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
                    return [4, (0, gemini_1.generateFromGemini)(modelName, promptForManimCode)];
                case 2:
                    response = _d.sent();
                    manimCode = response.text();
                    codeMatch = manimCode.match(/```python\s*([\s\S]*?)\s*```/);
                    if (!codeMatch || !codeMatch[1]) {
                        logger_js_1.default.error('Failed to extract Python code block from Gemini response:', {
                            responseText: manimCode,
                            scene_number: scene_number
                        });
                        throw new AppError_js_1.AppError('Failed to extract valid Manim code from Gemini response.', 500, false, {
                            responseText: manimCode,
                            scene_number: scene_number
                        });
                    }
                    return [2, codeMatch[1].trim()];
                case 3:
                    error_2 = _d.sent();
                    if (error_2 instanceof AppError_js_1.AppError)
                        throw error_2;
                    logger_js_1.default.error("Error generating Manim code from Gemini for scene ".concat(scene_number, ":"), {
                        error: error_2 instanceof Error ? error_2.message : String(error_2)
                    });
                    detail = error_2 instanceof Error ? error_2.message : 'Unknown Gemini API error';
                    throw new AppError_js_1.AppError("Failed to communicate with Gemini for Manim code: ".concat(detail), 502, false, {
                        originalError: error_2 instanceof Error ? error_2.message : String(error_2),
                        scene_number: scene_number
                    });
                case 4:
                    return [2];
            }
        });
    });
};
exports.generateManimCodeForScene = generateManimCodeForScene;
