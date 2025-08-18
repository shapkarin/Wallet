import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { viteStaticCopy } from 'vite-plugin-static-copy';
const currentDir = __dirname;

export default defineConfig(({ mode }) => ({
  plugins: [
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
