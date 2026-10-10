import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'api-dev-server',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api/health')) {
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                status: 'ok',
                app: 'บ่อดี (BODI)',
                version: '1.0.0',
                timezone: 'Asia/Bangkok',
                time: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
                timestamp: new Date().toISOString(),
                database: {
                  configured: !!process.env.DATABASE_URL,
                },
              })
            );
            return;
          }
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
