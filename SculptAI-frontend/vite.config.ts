import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    // Provide fallback value for env variables
    // 'import.meta.env.VITE_API_URL': JSON.stringify('dockerdeploy-production.up.railway.app/api/v1'),
    'import.meta.env.VITE_APP_TITLE': JSON.stringify(process.env.npm_package_name),
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version),
  },
  server: {
    port: 3000, // Match the port expected by backend CORS settings
    open: true,
  },
})
