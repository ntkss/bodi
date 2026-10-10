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
        const matchApiRoute = (pathname: string) => {
          const p = pathname.replace(/\/$/, '');
          const exactRoutes: Record<string, string> = {
            '/api/health': './api/health.ts',
            '/api/auth/google': './api/auth/google.ts',
            '/api/auth/me': './api/auth/me.ts',
            '/api/auth/dev-login': './api/auth/dev-login.ts',
            '/api/ponds': './api/ponds/index.ts',
            '/api/logs': './api/logs/index.ts',
            '/api/finance': './api/finance/index.ts',
            '/api/alerts': './api/alerts/index.ts',
            '/api/farm': './api/farm/index.ts',
            '/api/environmental': './api/environmental/index.ts',
            '/api/environmental/sync': './api/environmental/sync.ts',
          };

          if (exactRoutes[p]) {
            return { filePath: exactRoutes[p], params: {} };
          }

          const dynamicRoutes = [
            { prefix: '/api/ponds/', filePath: './api/ponds/[id].ts' },
            { prefix: '/api/logs/', filePath: './api/logs/[id].ts' },
            { prefix: '/api/finance/', filePath: './api/finance/[id].ts' },
            { prefix: '/api/alerts/', filePath: './api/alerts/[id].ts' },
          ];

          for (const route of dynamicRoutes) {
            if (p.startsWith(route.prefix)) {
              const id = p.slice(route.prefix.length);
              if (id && !id.includes('/')) {
                return { filePath: route.filePath, params: { id } };
              }
            }
          }

          return null;
        };

        server.middlewares.use(async (req, res, next) => {
          if (!req.url || !req.url.startsWith('/api/')) {
            return next();
          }

          try {
            const urlObj = new URL(req.url, 'http://localhost:5173');
            const match = matchApiRoute(urlObj.pathname);

            if (!match) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'API route not found' }));
              return;
            }

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

            const query: Record<string, any> = { ...match.params };
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

            const mod = await server.ssrLoadModule(match.filePath);
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
