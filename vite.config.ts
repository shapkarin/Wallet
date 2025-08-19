import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { Buffer } from 'buffer';

import { visualizer } from 'rollup-plugin-visualizer';
import { resolve } from 'path';
const currentDir = __dirname;

export default defineConfig(({ mode }) => ({
  plugins: [
    ...(mode === 'extension' ? [] : [reactRouter()]),
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
          {
            src: 'public/favicon.ico',
            dest: '.'
          }
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
    'global.Buffer': Buffer,
  },
  resolve: {
    alias: {
      buffer: 'buffer',
    },
  },
  optimizeDeps: {
    include: ['buffer', 'ethers', '@scure/bip39'],
  },


  build: {
    target: 'es2020',
    minify: process.env.NODE_ENV === 'production' ? 'terser' : false,
    sourcemap: process.env.NODE_ENV === 'production' ? false : true,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 800,
    reportCompressedSize: process.env.NODE_ENV === 'production',
    assetsInlineLimit: 4096,
    
    ...(mode === 'extension' ? {
      outDir: 'dist-extension',
      rollupOptions: {
        input: resolve(__dirname, 'public/popup.html'),
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('@scure/bip39') || id.includes('ethers') || id.includes('buffer')) {
                return 'crypto-vendor';
              }
              if (id.includes('react') || id.includes('redux')) {
                return 'ui-vendor';
              }
              if (id.includes('react-router')) {
                return 'router-vendor';
              }
              return 'vendor';
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
              if (id.includes('@scure/bip39') || id.includes('ethers') || id.includes('buffer')) {
                return 'crypto-vendor';
              }
              if (id.includes('react') || id.includes('redux')) {
                return 'ui-vendor';
              }
              if (id.includes('react-router')) {
                return 'router-vendor';
              }
              return 'vendor';
            }
          }
        }
      }
    }),

    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
        pure_funcs: process.env.NODE_ENV === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
        passes: 2,
        unsafe: false,
        unsafe_comps: false,
        unsafe_math: false,
        unsafe_proto: false
      },
      mangle: {
        safari10: true,
        keep_fnames: false,
        keep_classnames: false
      },
      format: {
        comments: false
      }
    }
  }
}));
