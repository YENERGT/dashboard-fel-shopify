import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
    }),
    // Análisis de bundle en desarrollo
    process.env.ANALYZE && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  css: {
    postcss: false,
  },
  build: {
    assetsInlineLimit: 4096, // Inline assets pequeños
    // Configuración más compatible para deployment
    minify: process.env.NODE_ENV === 'production' ? 'terser' : false,
    terserOptions: process.env.NODE_ENV === 'production' ? {
      compress: {
        drop_console: true, // Remover console.logs en producción
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug'], // Remover funciones específicas
      },
      mangle: {
        safari10: true, // Compatibilidad con Safari 10
      },
      format: {
        comments: false, // Remover comentarios
      },
    } : undefined,
    target: 'es2020',
    sourcemap: false, // Desactivar sourcemaps en producción
    rollupOptions: {
      output: {
        // Chunking estratégico simplificado - dejar que Vite decida automáticamente
        manualChunks: undefined,
        // Nombres de archivos con hash para caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
      external: [], // No externalizar nada para simplificar deployment
    },
  },
  optimizeDeps: {
    include: [
      '@shopify/polaris',
      'chart.js',
      'react-chartjs-2',
      'date-fns',
      'axios',
      'react',
      'react-dom'
    ],
    // Pre-bundling para dependencias problemáticas
    force: process.env.NODE_ENV === 'development',
  },
  server: {
    hmr: {
      port: process.env.HMR_SERVER_PORT || 8002,
    },
    // Configuración de proxy para desarrollo
    proxy: process.env.NODE_ENV === 'development' ? {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    } : undefined,
  },
  // Performance hints
  esbuild: {
    // Optimizaciones de ESBuild
    treeShaking: true,
    minifyIdentifiers: process.env.NODE_ENV === 'production',
    minifySyntax: process.env.NODE_ENV === 'production',
    minifyWhitespace: process.env.NODE_ENV === 'production',
  },
});