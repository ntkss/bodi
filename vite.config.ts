import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const pkg = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, './package.json'), 'utf-8')
);

let commitHash = 'dev';
try {
  commitHash =
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
    execSync('git rev-parse --short HEAD').toString().trim();
} catch {
  commitHash = 'dev';
}

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __COMMIT_HASH__: JSON.stringify(commitHash),
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'api-dev-server',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url || !req.url.startsWith('/api/')) {
            return next();
          }

          try {
            const urlObj = new URL(req.url, 'http://localhost:5173');

            // Parse request body for methods that transmit payload
            let body: any = undefined;
            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method || '')) {
              const chunks: Buffer[] = [];
              for await (const chunk of req) {
                chunks.push(Buffer.from(chunk));
              }
              const raw = Buffer.concat(chunks).toString('utf-8');
              if (raw) {
                try {
                  body = JSON.parse(raw);
                } catch {
                  body = raw;
                }
              }
            }

            const query: Record<string, any> = {};
            urlObj.searchParams.forEach((val, key) => {
              query[key] = val;
            });

            (req as any).query = query;
            (req as any).body = body;

            (res as any).status = function (code: number) {
              res.statusCode = code;
              return res;
            };
            (res as any).json = function (data: any) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
              return res;
            };
            (res as any).send = function (data: any) {
              if (typeof data === 'object') {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
              } else {
                res.end(String(data));
              }
              return res;
            };

            const mod = await server.ssrLoadModule('./api/index.ts');
            const handler = mod.default || mod;
            await handler(req, res);
          } catch (err) {
            console.error('API Error in dev server:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                error: 'Internal Server Error',
                details: err instanceof Error ? err.message : String(err),
              })
            );
          }
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
