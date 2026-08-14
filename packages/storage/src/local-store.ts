import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export class LocalFileStore {
  constructor(private readonly basePath: string) {}

  async ensureReady(): Promise<void> {
    await mkdir(this.basePath, { recursive: true });
    await mkdir(join(this.basePath, "quarantine"), { recursive: true });
    await mkdir(join(this.basePath, "protected"), { recursive: true });
  }

  quarantinePath(objectKey: string): string {
    return join(this.basePath, objectKey);
  }

  protectedPath(objectKey: string): string {
    return join(this.basePath, "protected", objectKey.replace(/^quarantine\//, ""));
  }

  async writeQuarantine(objectKey: string, data: Buffer): Promise<void> {
    const path = this.quarantinePath(objectKey);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, data);
  }

  async readQuarantine(objectKey: string): Promise<Buffer> {
    return readFile(this.quarantinePath(objectKey));
  }

  async promoteToProtected(objectKey: string, data: Buffer): Promise<string> {
    const protectedKey = objectKey.replace(/^quarantine\//, "protected/");
    const path = join(this.basePath, protectedKey);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, data);
    return protectedKey;
  }
}
