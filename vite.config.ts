import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { viteStaticCopy } from 'vite-plugin-static-copy';
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
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
          }
        ]
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
    exclude: ['argon2-browser'],
  },
  worker: {
    format: 'es',
    plugins: () => [wasm(), topLevelAwait()],
  },
  build: {
    target: 'es2020',
    minify: 'terser',
    sourcemap: mode === 'development',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    
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
          manualChunks: {
            'crypto-vendor': ['argon2-browser', 'bip39', 'ethers'],
            'ui-vendor': ['react', 'react-dom', 'react-redux', '@reduxjs/toolkit'],
            'router-vendor': ['react-router']
          }
        },
        external: mode === 'extension' ? [] : undefined
      }
    } : {
      outDir: 'build',
      rollupOptions: {
        output: {
          manualChunks: {
            'crypto-vendor': ['argon2-browser', 'bip39', 'ethers'],
            'ui-vendor': ['react', 'react-dom', 'react-redux', '@reduxjs/toolkit'],
            'router-vendor': ['react-router']
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
