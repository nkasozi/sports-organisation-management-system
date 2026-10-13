import type { AppSettingsPort } from "$lib/core/interfaces/ports";
import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";
import { get_app_settings_storage } from "$lib/infrastructure/container";
import { is_string_value } from "$lib/presentation/logic/runtimeTypeGuards";

const COLUMN_PREFERENCES_PREFIX = "col_prefs_";

const COLUMN_PREFERENCES_EVENTS = {
  SAVED: "column_preferences_saved",
  RESTORED: "column_preferences_restored",
  INVALID_CACHE: "column_preferences_invalid_cache",
} as const;

interface ColumnPreferenceResult {
  restored: boolean;
  columns: Set<string>;
}

interface ColumnPreferenceCommand {
  entity_type: string;
  sub_entity_filter?: SubEntityFilter;
}

interface SaveColumnPreferencesCommand extends ColumnPreferenceCommand {
  visible_columns: Set<string>;
  storage?: AppSettingsPort;
}

interface LoadColumnPreferencesCommand extends ColumnPreferenceCommand {
  available_field_names: string[];
  storage?: AppSettingsPort;
}

interface ClearColumnPreferencesCommand extends ColumnPreferenceCommand {
  storage?: AppSettingsPort;
}

export function build_column_cache_key(
  command: ColumnPreferenceCommand,
): string {
  let key = `${COLUMN_PREFERENCES_PREFIX}${command.entity_type}`;

  if (!command.sub_entity_filter) return key;

  key += `_${command.sub_entity_filter.foreign_key_field}`;

  if (command.sub_entity_filter.holder_type_field) {
    key += `_${command.sub_entity_filter.holder_type_field}`;
  }

  return key;
}

export async function save_column_preferences(
  command: SaveColumnPreferencesCommand,
): Promise<boolean> {
  const storage = command.storage ?? get_app_settings_storage();

  if (command.visible_columns.size === 0) return false;

  const cache_key = build_column_cache_key(command);
  const column_names = Array.from(command.visible_columns);

  await storage.set_setting(cache_key, JSON.stringify(column_names));

  console.log("[ColumnPrefs] Saved column preferences", {
    event: COLUMN_PREFERENCES_EVENTS.SAVED,
    entity_type: command.entity_type,
    cache_key,
    column_count: column_names.length,
  });

  return true;
}

export async function load_column_preferences(
  command: LoadColumnPreferencesCommand,
): Promise<ColumnPreferenceResult> {
  const storage = command.storage ?? get_app_settings_storage();
  const cache_key = build_column_cache_key(command);
  const stored_value = await storage.get_setting(cache_key);

  if (!stored_value) return { restored: false, columns: new Set() };

  try {
    const parsed_columns = JSON.parse(stored_value) as unknown;

    if (!Array.isArray(parsed_columns))
      return { restored: false, columns: new Set() };

    const available_set = new Set(command.available_field_names);
    const valid_columns = parsed_columns.filter(
      (column_name: unknown): column_name is string =>
        is_string_value(column_name) && available_set.has(column_name),
    );

    if (valid_columns.length === 0)
      return { restored: false, columns: new Set() };

    console.log("[ColumnPrefs] Restored cached column preferences", {
      event: COLUMN_PREFERENCES_EVENTS.RESTORED,
      entity_type: command.entity_type,
      cache_key,
      column_count: valid_columns.length,
    });

    return { restored: true, columns: new Set(valid_columns) };
  } catch (error) {
    console.warn("[ColumnPrefs] Ignoring invalid cached column data", {
      event: COLUMN_PREFERENCES_EVENTS.INVALID_CACHE,
      entity_type: command.entity_type,
      cache_key,
      error: String(error),
    });
    return { restored: false, columns: new Set() };
  }
}

export async function clear_column_preferences(
  command: ClearColumnPreferencesCommand,
): Promise<boolean> {
  const storage = command.storage ?? get_app_settings_storage();
  const cache_key = build_column_cache_key(command);
  const existed = Boolean(await storage.get_setting(cache_key));

  await storage.remove_setting(cache_key);

  return existed;
}
