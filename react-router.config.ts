import type { Config } from "@react-router/dev/config";

export default {
  ssr: false,
  vite: {
    assetsInclude: ['**/*.wasm'],
    optimizeDeps: {
      include: ['buffer'],
    }
  }
} satisfies Config;
