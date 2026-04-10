import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { copyFileSync, existsSync, unlinkSync, rmSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Post-build plugin: moves dist/admin/admin/index.html → dist/admin/index.html
 * because Vite preserves the input directory structure (admin/ prefix).
 */
function flattenAdminHtml(): Plugin {
    return {
        name: 'flatten-admin-html',
        closeBundle() {
            const nested = resolve(__dirname, 'dist/admin/admin/index.html')
            const target = resolve(__dirname, 'dist/admin/index.html')
            if (existsSync(nested)) {
                copyFileSync(nested, target)
                unlinkSync(nested)
                // Remove empty nested admin/ directory
                try { rmSync(resolve(__dirname, 'dist/admin/admin'), { recursive: true }) } catch {}
                console.log('  ✅ Flattened dist/admin output')
            }
        }
    }
}

/**
 * ADMIN-ONLY Vite Config
 * ──────────────────────
 * Builds the admin panel as a self-contained app with:
 *   base: '/admin/'  → all asset URLs become /admin/assets/xxx.js
 *   outDir: dist/admin → all files land inside dist/admin/
 *
 * This makes the Nginx `location /admin` block work perfectly
 * because BOTH the HTML and its JS/CSS live under /admin/.
 */
export default defineConfig({
    plugins: [react(), flattenAdminHtml()],
    esbuild: {
        jsxInject: `import React from 'react'`
    },
    base: '/admin/',
    build: {
        outDir: resolve(__dirname, 'dist/admin'),
        emptyOutDir: false, // Ensure we don't wipe the main dist folder!
        rollupOptions: {
            input: resolve(__dirname, 'admin/index.html'),
        }
    }
})
