import { defineConfig, loadEnv } from 'vite'
import { readPublicConfig } from './src/lib/config-values.js'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    const { errors } = readPublicConfig(loadEnv(mode, process.cwd(), 'VITE_'));
    if (errors.length) throw new Error(`Invalid public configuration:\n${errors.join('\n')}`);
  }
  return {
  plugins: [react()],
  base: '/',
  publicDir: 'public',  // ← ADD THIS LINE
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
    historyApiFallback: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
  },
  preview: {
    port: 5173,
    historyApiFallback: true,
  },
  };
})
