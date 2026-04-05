const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("guardsimDesktop", {
  /** Зарезервировано для будущих IPC (файлы, уведомления и т.д.) */
  platform: process.platform,
});
