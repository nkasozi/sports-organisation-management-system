import type { BaseEntity } from "../../core/entities/BaseEntity";

export function check_if_all_entities_selected(
  entity_list: BaseEntity[],
  selected_ids: Set<string>,
): boolean {
  if (!entity_list || entity_list.length === 0) return false;
  if (!selected_ids || selected_ids.size === 0) return false;
  return entity_list.every((entity) => selected_ids.has(entity.id));
}

export function check_if_some_entities_selected(
  selected_ids: Set<string> | null | undefined,
): boolean {
  if (!selected_ids) return false;
  return selected_ids.size > 0;
}

export function determine_if_bulk_actions_available(
  has_selection: boolean,
  actions_enabled: boolean,
): boolean {
  return has_selection && actions_enabled;
}

export function toggle_select_all_entities(
  entities: BaseEntity[],
  currently_all_selected: boolean,
): Set<string> {
  if (currently_all_selected) return new Set<string>();
  return new Set(entities.map((entity) => entity.id));
}

export function toggle_single_entity_selection(
  selected_ids: Set<string>,
  entity_id: string,
): Set<string> {
  const new_selected = new Set(selected_ids);
  if (new_selected.has(entity_id)) {
    new_selected.delete(entity_id);
  } else {
    new_selected.add(entity_id);
  }
  return new_selected;
}

export function get_selected_entities_from_list(
  entities: BaseEntity[],
  selected_ids: Set<string>,
): BaseEntity[] {
  if (!entities || entities.length === 0) return [];
  if (!selected_ids || selected_ids.size === 0) return [];
  return entities.filter((entity) => selected_ids.has(entity.id));
}
