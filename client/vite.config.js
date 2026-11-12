import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const api = env.VITE_DEV_API_PROXY || 'http://localhost:5000';
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': { target: api, changeOrigin: true },
        '/uploads': { target: api, changeOrigin: true },
        '/sitemap.xml': { target: api, changeOrigin: true },
        '/robots.txt': { target: api, changeOrigin: true },
      },
    },
    build: { outDir: 'dist', sourcemap: false },
  };
});
