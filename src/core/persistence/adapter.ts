/**
 * Storage abstraction. The renderer never touches the file system; in Electron
 * the main process owns a NodeStorageAdapter rooted at userData, and the
 * renderer reaches it only through the narrow IPC surface in preload.
 */
export interface StorageAdapter {
  read(fileName: string): Promise<string | null>;
  /** Must be atomic: never leave a partially written file. */
  writeAtomic(fileName: string, contents: string): Promise<void>;
  delete(fileName: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
}

/** In-memory adapter for tests and browser-only dev mode. */
export class MemoryStorageAdapter implements StorageAdapter {
  private files = new Map<string, string>();

  async read(fileName: string): Promise<string | null> {
    return this.files.get(fileName) ?? null;
  }
  async writeAtomic(fileName: string, contents: string): Promise<void> {
    this.files.set(fileName, contents);
  }
  async delete(fileName: string): Promise<void> {
    this.files.delete(fileName);
  }
  async list(prefix: string): Promise<string[]> {
    return [...this.files.keys()].filter((k) => k.startsWith(prefix)).sort();
  }
}
