export interface AppSettingsPort {
  get_setting(key: string): Promise<string | null>;
  set_setting(key: string, value: string): Promise<void>;
  remove_setting(key: string): Promise<void>;
  clear_all_settings(): Promise<void>;
}
