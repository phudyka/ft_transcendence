import { defineConfig } from "vite";
import { resolve } from "node:path";

// En développement, `docker compose up` expose nginx sur https://localhost:8080
// avec un certificat auto-signé : Vite lui proxifie l'API et les websockets
// (`secure: false` accepte le certificat). Le frontend, lui, est servi par Vite.
const BACKEND = process.env.VITE_DEV_BACKEND || "https://localhost:8080";
const proxy = { target: BACKEND, changeOrigin: true, secure: false };

export default defineConfig({
  // 44 `console.*` partaient en production. On les garde en développement.
  esbuild: { drop: ["console", "debugger"] },
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        game: resolve(import.meta.dirname, "game.html"),
      },
    },
  },
  server: {
    proxy: {
      "/api": proxy,
      "/media": proxy,
      "/socket.io": { ...proxy, ws: true },
    },
  },
});
