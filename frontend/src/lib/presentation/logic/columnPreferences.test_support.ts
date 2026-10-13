import { vi } from "vitest";

import type { AppSettingsPort } from "$lib/core/interfaces/ports";

export function create_mock_storage(): AppSettingsPort {
  const store = {} as Record<string, string>;
  return {
    get_setting: vi.fn((key: string) => Promise.resolve(store[key] ?? "")),
    set_setting: vi.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    remove_setting: vi.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
    clear_all_settings: vi.fn(() => {
      Object.keys(store).forEach((k) => delete store[k]);
      return Promise.resolve();
    }),
  } as AppSettingsPort;
}
