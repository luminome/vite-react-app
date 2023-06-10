import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      host: "localhost",
      port: 15319 ///15319
    }
  },
  build: {
    cssCodeSplit: false
  }

})

