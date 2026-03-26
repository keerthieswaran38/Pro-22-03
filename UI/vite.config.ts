import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Plugin to rewrite /admin -> /admin/index.html in dev
function adminRewrite(): Plugin {
    return {
        name: 'admin-rewrite',
        configureServer(server) {
            server.middlewares.use((req, _res, next) => {
                if (req.url === '/admin' || req.url === '/admin/') {
                    req.url = '/admin/index.html'
                }
                // Handle admin sub-routes for SPA
                if (req.url?.startsWith('/admin/') && !req.url.includes('.')) {
                    req.url = '/admin/index.html'
                }
                next()
            })
        }
    }
}

export default defineConfig({
    plugins: [react(), adminRewrite()],
    server: {
        port: 3008,
        strictPort: false,
        proxy: {
            '/api': 'http://localhost:5000'
        }
    },
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                eventDetails: resolve(__dirname, 'event-details.html'),
                admin: resolve(__dirname, 'admin/index.html'),
            }
        }
    }
})
