import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // If deploying to a subdirectory (e.g. GitHub Pages project site),
  // set base to your repo name: base: '/rxp-editor/'
  base: '/',
})
