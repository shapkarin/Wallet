import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { viteStaticCopy } from 'vite-plugin-static-copy';
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { visualizer } from 'rollup-plugin-visualizer';
import { resolve } from 'path';
const currentDir = __dirname;

export default defineConfig(({ mode }) => ({
  plugins: [
    wasm(),
    topLevelAwait(),
    reactRouter(), 
    tsconfigPaths(),
    ...(mode === 'extension' ? [
      viteStaticCopy({
        targets: [
          {
            src: 'public/manifest.json',
            dest: '.'
          },
          {
            src: 'public/background.js',
            dest: '.'
          },

        ]
      })
    ] : [
      viteStaticCopy({
        targets: [

        ]
      })
    ]),
    ...(process.env.ANALYZE === 'true' ? [
      visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
      })
    ] : []),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "${currentDir}/app/styles/global.scss" as *;`
      }
    }
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
    },
  },
  optimizeDeps: {
    include: ['buffer'],
  },
  assetsInclude: ['**/*.wasm'],
  worker: {
    format: 'es',
    plugins: () => [wasm(), topLevelAwait()],
  },
  build: {
    target: 'es2020',
    minify: process.env.NODE_ENV === 'production' ? 'terser' : false,
    sourcemap: process.env.NODE_ENV === 'production' ? false : true,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false,
    
    ...(mode === 'extension' ? {
      outDir: 'dist-extension',
      rollupOptions: {
        input: {
          popup: 'index.html'
        },
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('bip39') || id.includes('ethers')) {
                return 'crypto-vendor';
              }
              if (id.includes('react') || id.includes('redux')) {
                return 'ui-vendor';
              }
              if (id.includes('react-router')) {
                return 'router-vendor';
              }
            }
          }
        },
        external: []
      }
    } : {
      outDir: 'build',
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('bip39') || id.includes('ethers')) {
                return 'crypto-vendor';
              }
              if (id.includes('react') || id.includes('redux')) {
                return 'ui-vendor';
              }
              if (id.includes('react-router')) {
                return 'router-vendor';
              }
            }
          }
        }
      }
    }),

    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: true,
        pure_funcs: mode === 'production' ? ['console.log', 'console.info', 'console.debug'] : []
      },
      mangle: {
        safari10: true
      }
    }
  }
}));
