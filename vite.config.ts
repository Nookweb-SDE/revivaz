import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { Plugin } from 'vite';

// Plugin: inline o CSS global no <head> eliminando o link render-blocking
function inlineCssPlugin(): Plugin {
  let cssContent = '';
  return {
    name: 'inline-global-css',
    apply: 'build',
    generateBundle(_opts, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (fileName.endsWith('.css') && 'source' in chunk) {
          cssContent = chunk.source as string;
          delete bundle[fileName];
        }
      }
    },
    transformIndexHtml(html) {
      // Remove link tags apontando para o CSS gerado e injeta inline
      const cleaned = html.replace(/<link rel="stylesheet"[^>]*assets\/index[^"]*\.css"[^>]*>/g, '');
      return cleaned.replace('</head>', `<style>${cssContent}</style></head>`);
    },
  };
}

export default defineConfig({
  plugins: [react(), inlineCssPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        acolhimento: "acolhimento.html",
        conta: "conta.html",
      },
    },
  },
});
