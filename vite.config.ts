import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { viteStaticCopy } from 'vite-plugin-static-copy';
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
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
    ...(mode === 'extension' ? {
      outDir: 'dist-extension',
      rollupOptions: {
        input: {
          popup: 'index.html'
        },
        output: {
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/[name].[ext]'
        }
      }
    } : {
      outDir: 'build'
    })
  }
}));
