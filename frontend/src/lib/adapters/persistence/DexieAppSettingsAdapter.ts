import type { AppSettingsPort } from "$lib/core/interfaces/ports";

import { get_database } from "../repositories/database";

export class DexieAppSettingsAdapter implements AppSettingsPort {
  async get_setting(key: string): Promise<string> {
    const row = await get_database().app_settings.get(key);
    return row?.value ?? "";
  }

  async set_setting(key: string, value: string): Promise<void> {
    await get_database().app_settings.put({ key, value });
  }

  async remove_setting(key: string): Promise<void> {
    await get_database().app_settings.delete(key);
  }

  async clear_all_settings(): Promise<void> {
    await get_database().app_settings.clear();
  }
}
