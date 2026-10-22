import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Forward API calls to peaks_server (`cargo run -p peaks_server` in DVA), so the browser sees
    // a single origin and the server needs no CORS setup.
    proxy: {
      '/api': 'http://127.0.0.1:3001',
    },
  },
})
