import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'
import dts from 'vite-plugin-dts';
import { resolve } from 'path';
import pkg from './package.json' with { type: 'json' };

const externals = new Set([
  ...Object.keys(pkg.dependencies),
  ...Object.keys(pkg.peerDependencies),
]);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Only used by the playground (dev server); the library build ships dist/styles.css via `build:css`
    tailwindcss(),
    dts({
      // The root tsconfig.json only has project references, so point at the app config
      tsconfigPath: resolve(import.meta.dirname, 'tsconfig.app.json'),
      entryRoot: 'lib',       // Emit lib/main.ts as dist/main.d.ts
      include: ['lib'],       // Only generate types for our library source
      exclude: ['lib/**/*.test.ts', 'lib/**/*.test.tsx', 'lib/test/**']
    })
  ],
  build: {
    lib: {
      // One entry per public import path: "@dtkt/protoform", ".../components", ".../providers", ".../kit"
      entry: {
        main: resolve(import.meta.dirname, 'lib/main.ts'),
        'components/index': resolve(import.meta.dirname, 'lib/components/index.ts'),
        'providers/index': resolve(import.meta.dirname, 'lib/providers/index.ts'),
        'kit/index': resolve(import.meta.dirname, 'lib/kit/index.ts'),
        'kit/tailwind/index': resolve(import.meta.dirname, 'lib/kit/tailwind/index.tsx'),
      },
      // UMD/IIFE can't be built from multiple entries
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`
    },
    rollupOptions: {
      // Don't bundle dependencies or peer dependencies (including their subpaths)
      external: [...externals].map((name) => new RegExp(`^${name}(/.*)?$`))
    }
  },
  test: {
    environment: 'jsdom',
    include: ['lib/**/*.test.{ts,tsx}'],
    setupFiles: ['./lib/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['lib/**'],
      // select.tsx is a commented-out placeholder for RPC-backed options
      exclude: ['lib/test/**', 'lib/**/*.test.*', 'lib/**/index.ts', 'lib/components/select.tsx', 'lib/main.ts'],
    },
  },
})
