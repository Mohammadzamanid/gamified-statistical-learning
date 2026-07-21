/**
 * Electron main process. Owns the window, the storage root, and the SaveManager.
 * The renderer gets no Node or file-system access; every persistence operation
 * crosses the narrow, validated IPC surface below.
 */
import { app, BrowserWindow, ipcMain, shell } from "electron";
import * as path from "node:path";
import { NodeStorageAdapter } from "../core/persistence/node-adapter";
import { SaveManager } from "../core/persistence/save-manager";
import { SaveFileSchema, SettingsSchema } from "../shared/schemas";

const isDev = process.env.NODE_ENV === "development";

let mainWindow: BrowserWindow | null = null;

function createSaveManager(): SaveManager {
  const root = path.join(app.getPath("userData"), "statlas-data");
  return new SaveManager(new NodeStorageAdapter(root));
}

const saveManager = createSaveManager();

function registerIpc(): void {
  ipcMain.handle("profiles:list", () => saveManager.listProfiles());
  ipcMain.handle("profiles:create", (_e, name: unknown, isGuest: unknown) => {
    if (typeof name !== "string" || name.length > 60) throw new Error("invalid profile name");
    return saveManager.createProfile(name, isGuest === true);
  });
  ipcMain.handle("profiles:delete", (_e, id: unknown) => {
    if (typeof id !== "string") throw new Error("invalid profile id");
    return saveManager.deleteProfile(id);
  });

  ipcMain.handle("save:load", (_e, profileId: unknown) => {
    if (typeof profileId !== "string") throw new Error("invalid profile id");
    return saveManager.loadGame(profileId);
  });
  ipcMain.handle("save:save", (_e, save: unknown) => {
    const parsed = SaveFileSchema.safeParse(save);
    if (!parsed.success) throw new Error("invalid save payload");
    return saveManager.saveGame(parsed.data);
  });
  ipcMain.handle("save:reset", (_e, profileId: unknown) => {
    if (typeof profileId !== "string") throw new Error("invalid profile id");
    return saveManager.resetProgress(profileId);
  });
  ipcMain.handle("save:export", (_e, profileId: unknown) => {
    if (typeof profileId !== "string") throw new Error("invalid profile id");
    return saveManager.exportSave(profileId);
  });
  ipcMain.handle("save:import", (_e, serialized: unknown) => {
    if (typeof serialized !== "string" || serialized.length > 10_000_000) throw new Error("invalid import payload");
    return saveManager.importSave(serialized);
  });

  ipcMain.handle("settings:load", () => saveManager.loadSettings());
  ipcMain.handle("settings:save", (_e, settings: unknown) => {
    const parsed = SettingsSchema.safeParse(settings);
    if (!parsed.success) throw new Error("invalid settings payload");
    return saveManager.saveSettings(parsed.data);
  });

  ipcMain.handle("app:version", () => app.getVersion());
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#0d1b2a",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  });

  mainWindow.once("ready-to-show", () => mainWindow?.show());

  // External links open in the system browser, never inside the app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) void shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    void mainWindow.loadFile(path.join(__dirname, "../../dist/index.html"));
  }
}

app.whenReady().then(() => {
  registerIpc();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
