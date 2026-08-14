import { Injectable, OnModuleInit } from "@nestjs/common";
import { getConfig } from "@applyflow/config";
import { LocalFileStore } from "@applyflow/storage";

@Injectable()
export class StorageService implements OnModuleInit {
  private store!: LocalFileStore;

  async onModuleInit() {
    const config = getConfig();
    this.store = new LocalFileStore(config.LOCAL_STORAGE_PATH);
    await this.store.ensureReady();
  }

  getStore(): LocalFileStore {
    return this.store;
  }
}
