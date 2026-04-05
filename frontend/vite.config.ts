/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
        configure(proxy) {
          proxy.on("error", (err, _req, res) => {
            console.error("[vite proxy /api]", err.message);
            if (res && !res.headersSent && "writeHead" in res) {
              const r = res as import("http").ServerResponse;
              r.writeHead(502, { "Content-Type": "application/json" });
              r.end(
                JSON.stringify({
                  error:
                    "Бэкенд недоступен на :8080. Запустите Spring Boot (make backend) и обновите страницу.",
                }),
              );
            }
          });
        },
      },
    },
  },
  preview: {
    port: 4173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
    },
  },
});
