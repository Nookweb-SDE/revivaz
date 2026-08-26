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
      // Remove o <link> do CSS gerado (qualquer nome hasheado em /assets/*.css,
      // independente da ordem dos atributos como crossorigin) e injeta inline.
      // Não casa /fonts/nunito.css (fica fora de /assets/).
      const cleaned = html.replace(/<link\b[^>]*href="[^"]*\/assets\/[^"]*\.css"[^>]*>/g, '');
      return cleaned.replace('</head>', `<style>${cssContent}</style></head>`);
    },
  };
}

export default defineConfig({
  plugins: [react(), inlineCssPlugin()],
  // DEV: encaminha /api pro servidor Express (tsx server/server.ts em :8080).
  // Sem isso, /api/* (dev-login, acolhimento, wa) daria 404 no `npm run dev`.
  server: {
    proxy: {
      "/api": { target: "http://localhost:8080", changeOrigin: true },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        // A entrada `acolhimento` saiu: o chat aberto ao público consumia cota da
        // assinatura sem cadastro nenhum. A IA continua, mas só dentro do /conta.
        conta: "conta.html",
        admin: "admin.html",
        profissional: "profissional.html",
      },
    },
  },
});
