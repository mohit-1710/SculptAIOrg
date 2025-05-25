import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    // Provide fallback value for env variables
    'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:5000/api/v1'),
  },
  server: {
    port: 3000, // Match the port expected by backend CORS settings
    open: true,
  },
})
