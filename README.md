# 🎨 SulptAI

SulptAI is an AI-powered web platform that transforms natural language prompts into 2D animated videos — complete with voiceover explanations. Designed for educators, content creators, and curious minds, SulptAI makes storytelling effortless and interactive.

---

## 🧠 Features

- 📝 **Prompt-Based Animation**: Just give a text prompt and get an animated 2D video.
- 🗣️ **Voice Explanation**: AI-generated voice narrates your topic like a human educator.
- 🕓 **Timestamp Editing**: Modify scenes or narration at specific points in the video.
- 🎬 **Scene Customization**: Direct your story with editable scenes and smooth transitions.

---

## 🚀 Tech Stack

### Frontend
- ⚛️ **React.js** (with Vite or CRA)
- 💬 **TypeScript** — for type-safe, scalable code
- 🎨 **TailwindCSS** (or custom styling) — for sleek, responsive design
- 🎥 **Lottie / Canvas / SVG Animations** — for dynamic 2D visuals
- 🔊 **Text-to-Speech API** — AI-generated narration
- 🎙️ **Whisper / ElevenLabs / Coqui** (optional, via backend)

### Backend (Dockerized - assumed setup)
- 🧠 **GeminiAI / Stability / Replicate APIs** — for prompt parsing, storyboarding, voice generation
- ⚙️ **Node.js / Express** or **Python (FastAPI)** — serving AI requests
- 🐳 **Docker** — containerized environment for easy deployment

---

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/sulptai.git
cd sculptai

# Install dependencies
npm install

# Start the development server
npm run dev

## Cloud Storage Implementation

SculptAI now uses Google Cloud Storage to store videos and audio files. This provides:

- Improved scalability and reliability
- Accessibility from anywhere
- Reduced server storage requirements

See [README-cloud-storage.md](SculptAI-backend/README-cloud-storage.md) for full implementation details.
