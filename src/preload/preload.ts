/**
 * Preload bridge. Exposes only the persistence and settings surface the app
 * needs — no generic invoke, no fs, no shell.
 */
import { contextBridge, ipcRenderer } from "electron";

const api = {
  profiles: {
    list: () => ipcRenderer.invoke("profiles:list"),
    create: (name: string, isGuest: boolean) => ipcRenderer.invoke("profiles:create", name, isGuest),
    delete: (id: string) => ipcRenderer.invoke("profiles:delete", id)
  },
  save: {
    load: (profileId: string) => ipcRenderer.invoke("save:load", profileId),
    save: (save: unknown) => ipcRenderer.invoke("save:save", save),
    reset: (profileId: string) => ipcRenderer.invoke("save:reset", profileId),
    export: (profileId: string) => ipcRenderer.invoke("save:export", profileId),
    import: (serialized: string) => ipcRenderer.invoke("save:import", serialized)
  },
  settings: {
    load: () => ipcRenderer.invoke("settings:load"),
    save: (settings: unknown) => ipcRenderer.invoke("settings:save", settings)
  },
  app: {
    version: () => ipcRenderer.invoke("app:version")
  }
};

export type StatlasBridge = typeof api;

contextBridge.exposeInMainWorld("statlas", api);
