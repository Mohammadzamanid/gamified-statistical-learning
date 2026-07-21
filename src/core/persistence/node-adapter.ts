/**
 * Node/Electron storage adapter rooted at a directory the main process chooses
 * (app.getPath("userData")). Atomic writes via temp file + rename on the same
 * volume. Never imported by the renderer.
 */
import { promises as fs } from "node:fs";
import * as path from "node:path";

export class NodeStorageAdapter {
  constructor(private readonly rootDir: string) {}

  private resolve(fileName: string): string {
    const full = path.resolve(this.rootDir, fileName);
    if (!full.startsWith(path.resolve(this.rootDir))) {
      throw new Error(`path escapes storage root: ${fileName}`);
    }
    return full;
  }

  async read(fileName: string): Promise<string | null> {
    try {
      return await fs.readFile(this.resolve(fileName), "utf8");
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw e;
    }
  }

  async writeAtomic(fileName: string, contents: string): Promise<void> {
    const target = this.resolve(fileName);
    await fs.mkdir(path.dirname(target), { recursive: true });
    const tmp = `${target}.tmp-${process.pid}-${Date.now()}`;
    const handle = await fs.open(tmp, "w");
    try {
      await handle.writeFile(contents, "utf8");
      await handle.sync();
    } finally {
      await handle.close();
    }
    await fs.rename(tmp, target);
  }

  async delete(fileName: string): Promise<void> {
    try {
      await fs.unlink(this.resolve(fileName));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    }
  }

  async list(prefix: string): Promise<string[]> {
    const dir = path.dirname(this.resolve(prefix.endsWith("/") ? `${prefix}x` : prefix));
    const filePrefix = path.basename(prefix.endsWith("/") ? "" : prefix);
    const relDir = path.relative(path.resolve(this.rootDir), dir);
    try {
      const entries = await fs.readdir(dir);
      return entries
        .filter((f) => f.startsWith(filePrefix) && !f.includes(".tmp-"))
        .map((f) => (relDir ? `${relDir.split(path.sep).join("/")}/${f}` : f))
        .sort();
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw e;
    }
  }
}
