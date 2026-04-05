const { app, BrowserWindow } = require("electron");
const path = require("path");
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

/**
 * В dev Electron подгружает Vite. Порт задаётся в `package.json` (`dev:vite`) и здесь же — переменная
 * GUARDSIM_VITE_PORT (по умолчанию 5180), чтобы не конфликтовать с другими инстансами на 5173+.
 */
const isDev = !app.isPackaged;
const DEV_VITE_PORT = process.env.GUARDSIM_VITE_PORT || "5180";

let mainWindow = null;
/** @type {import('http').Server | null} */
let localServer = null;

function distDir() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "frontend", "dist");
  }
  return path.join(__dirname, "..", "frontend", "dist");
}

function stopLocalServer() {
  if (localServer) {
    localServer.close();
    localServer = null;
  }
}

/**
 * @param {string} distPath
 * @returns {Promise<{ port: number; server: import('http').Server }>}
 */
function startLocalAppServer(distPath) {
  const expressApp = express();
  expressApp.use(
    "/api",
    createProxyMiddleware({
      target: "http://127.0.0.1:8080",
      changeOrigin: true,
      on: {
        error(err, _req, res) {
          console.error("[desktop proxy /api]", err.message);
          if (res && !res.headersSent && typeof res.writeHead === "function") {
            res.writeHead(502, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                error:
                  "Бэкенд недоступен на :8080. Запустите Spring Boot (make backend) и перезапустите окно.",
              }),
            );
          }
        },
      },
    }),
  );
  expressApp.use(express.static(distPath, { fallthrough: true }));
  expressApp.get(/.*/, (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  return new Promise((resolve, reject) => {
    const server = expressApp.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      if (!port) {
        reject(new Error("Не удалось получить порт локального сервера"));
        return;
      }
      resolve({ port, server });
    });
    server.on("error", reject);
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: "КиберСтоп — GuardSim",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (isDev) {
    await mainWindow.loadURL(`http://127.0.0.1:${DEV_VITE_PORT}/`);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    try {
      const { port, server } = await startLocalAppServer(distDir());
      localServer = server;
      await mainWindow.loadURL(`http://127.0.0.1:${port}/`);
    } catch (e) {
      console.error(e);
      await mainWindow.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(fallbackHtml(String(e))));
    }
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
    stopLocalServer();
  });
}

function fallbackHtml(message) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>GuardSim</title></head><body style="font-family:sans-serif;padding:24px;background:#111;color:#eee"><h1>Не удалось запустить приложение</h1><pre>${message.replace(
    /</g,
    "&lt;",
  )}</pre><p>Соберите фронтенд: в каталоге <code>desktop</code> выполните <code>npm run build:web</code>.</p></body></html>`;
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    void createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        void createWindow();
      }
    });
  });

  app.on("window-all-closed", () => {
    stopLocalServer();
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}
