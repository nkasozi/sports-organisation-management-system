import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";

const COLUMN_PREFERENCES_PREFIX = "col_prefs_";

export interface ColumnPreferenceResult {
  restored: boolean;
  columns: Set<string> | null;
}

export function build_column_cache_key(
  entity_type: string,
  sub_entity_filter: SubEntityFilter | null,
): string {
  let key = `${COLUMN_PREFERENCES_PREFIX}${entity_type}`;

  if (!sub_entity_filter) return key;

  key += `_${sub_entity_filter.foreign_key_field}`;

  if (sub_entity_filter.holder_type_field) {
    key += `_${sub_entity_filter.holder_type_field}`;
  }

  return key;
}

export function save_column_preferences(
  entity_type: string,
  sub_entity_filter: SubEntityFilter | null,
  visible_columns: Set<string>,
  storage: Storage = localStorage,
): boolean {
  if (visible_columns.size === 0) return false;

  const cache_key = build_column_cache_key(entity_type, sub_entity_filter);
  const column_names = Array.from(visible_columns);

  storage.setItem(cache_key, JSON.stringify(column_names));

  console.log(
    `[ColumnPrefs] Saved ${column_names.length} column preferences for ${entity_type} (key: ${cache_key})`,
  );

  return true;
}

export function load_column_preferences(
  entity_type: string,
  sub_entity_filter: SubEntityFilter | null,
  available_field_names: string[],
  storage: Storage = localStorage,
): ColumnPreferenceResult {
  const cache_key = build_column_cache_key(entity_type, sub_entity_filter);
  const stored_value = storage.getItem(cache_key);

  if (!stored_value) return { restored: false, columns: null };

  try {
    const parsed_columns = JSON.parse(stored_value) as unknown;

    if (!Array.isArray(parsed_columns))
      return { restored: false, columns: null };

    const available_set = new Set(available_field_names);
    const valid_columns = parsed_columns.filter(
      (column_name: unknown): column_name is string =>
        typeof column_name === "string" && available_set.has(column_name),
    );

    if (valid_columns.length === 0) return { restored: false, columns: null };

    console.log(
      `[ColumnPrefs] Restored ${valid_columns.length} cached columns for ${entity_type} (key: ${cache_key})`,
    );

    return { restored: true, columns: new Set(valid_columns) };
  } catch {
    console.warn(
      `[ColumnPrefs] Invalid cached column data for ${entity_type}, ignoring (key: ${cache_key})`,
    );
    return { restored: false, columns: null };
  }
}

export function clear_column_preferences(
  entity_type: string,
  sub_entity_filter: SubEntityFilter | null,
  storage: Storage = localStorage,
): boolean {
  const cache_key = build_column_cache_key(entity_type, sub_entity_filter);
  const existed = storage.getItem(cache_key) !== null;

  storage.removeItem(cache_key);

  return existed;
}
