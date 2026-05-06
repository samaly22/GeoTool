import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // proxy: {
  //   'dresden-wfs': {
  //     target: 'https://kommisdd.dresden.de',
  //     changeOrigin: true,
  //     rewrite: (path) => path.replace(/^\/dresden-wfs/, '')
  //   }
  // },
  plugins: [react()],
})
