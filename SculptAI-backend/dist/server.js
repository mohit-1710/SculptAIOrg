// src/server.ts
import app from './app.js'; // Import the configured Express app
import config from './config/index.js'; // Import our centralized config
const PORT = config.port; // Get port from our config
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`API prefix: ${config.api.prefix}`);
    console.log(`Environment: ${config.env}`);
    if (config.googleGenerativeAiApiKey) {
        console.log("GOOGLE_GENERATIVE_AI_API_KEY is loaded.");
    }
    else {
        console.warn("WARNING: GOOGLE_GENERATIVE_AI_API_KEY is NOT loaded. Check your .env file and src/config/index.ts.");
    }
    if (config.manimRenderService.endpoint) {
        console.log(`Manim Render Service Endpoint: ${config.manimRenderService.endpoint}`);
    }
    else {
        console.warn("WARNING: MANIM_RENDER_ENDPOINT is NOT configured.");
    }
});
//# sourceMappingURL=server.js.map