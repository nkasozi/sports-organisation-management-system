import {
  check_entity_permission,
  get_entity_data_category,
  get_entity_level_disabled_operations,
  normalize_to_entity_type,
} from "$lib/core/interfaces/ports";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CrudFunctionality,
  EntityCrudHandlers,
  EntityViewCallbacks,
} from "../../core/types/EntityHandlers";
import { is_functionality_disabled } from "../../core/types/EntityHandlers";
import { get_use_cases_for_entity_type } from "../../infrastructure/registry/entityUseCasesRegistry";
import type { AuthProfileState } from "../stores/authTypes";

export function get_disabled_crud_actions_for_profile(
  entity_type: string,
  profile_state: AuthProfileState,
): CrudFunctionality[] {
  if (profile_state.status !== "present") {
    console.log(
      `[EntityCrudWrapper] No profile - disabling all crud for "${entity_type}"`,
    );
    return ["create", "edit", "delete"];
  }

  const profile = profile_state.profile;
  const disabled_actions: CrudFunctionality[] = [];
  const normalized = normalize_to_entity_type(entity_type);
  const category = get_entity_data_category(normalized);
  if (!check_entity_permission(profile.role, normalized, "create"))
    disabled_actions.push("create");
  if (!check_entity_permission(profile.role, normalized, "update"))
    disabled_actions.push("edit");
  if (!check_entity_permission(profile.role, normalized, "delete"))
    disabled_actions.push("delete");
  for (const restricted_operation of get_entity_level_disabled_operations(
    normalized,
  )) {
    if (!disabled_actions.includes(restricted_operation))
      disabled_actions.push(restricted_operation);
  }
  console.log(
    `[EntityCrudWrapper] Permission check for "${entity_type}" (category: ${category}) with role "${profile.role}": disabled = [${disabled_actions.join(", ")}]`,
  );
  return disabled_actions;
}

export function compute_effective_disabled_functionalities(
  explicit_disabled: CrudFunctionality[],
  auth_disabled: CrudFunctionality[],
  normalized_entity_type: string,
): CrudFunctionality[] {
  const result = Array.from(new Set([...explicit_disabled, ...auth_disabled]));
  if (auth_disabled.length > 0) {
    console.log(
      `[EntityCrudWrapper] Authorization disabled actions for ${normalized_entity_type}:`,
      auth_disabled,
    );
  }
  return result;
}

export function normalize_entity_type(type: string): string {
  if (typeof type !== "string") return "";
  return type.toLowerCase().replace(/\s+/g, "").trim();
}

function format_entity_display_name(raw_name: string): string {
  if (typeof raw_name !== "string" || raw_name.length === 0) return "Entity";
  const with_spaces = raw_name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ");
  return with_spaces
    .split(" ")
    .map(
      (word: string) =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(" ");
}

export function build_page_title_for_current_view(
  view: string,
  type?: string,
): string {
  const type_display = format_entity_display_name(type || "");
  if (view === "create") return `Create New ${type_display}`;
  if (view === "edit") return `Edit ${type_display}`;
  return `${type_display} Management`;
}

export function build_crud_handlers_for_entity_type(
  normalized_type: string,
  filter_override: Record<string, unknown>,
): EntityCrudHandlers {
  const use_cases_result = get_use_cases_for_entity_type(normalized_type);
  if (!use_cases_result.success) {
    console.warn(
      `[EntityCrudWrapper] No use cases found for entity type: ${normalized_type}`,
    );
    return {};
  }
  const use_cases = use_cases_result.data;
  return {
    ...(use_cases.create
      ? {
          create: async (input: Record<string, unknown>) =>
            use_cases.create(input),
        }
      : {}),
    ...(use_cases.update
      ? {
          update: async (id: string, input: Record<string, unknown>) =>
            use_cases.update(id, input),
        }
      : {}),
    ...(use_cases.delete
      ? {
          delete: async (id: string) => use_cases.delete(id),
        }
      : {}),
    ...(use_cases.list
      ? {
          list: async (
            filter?: Record<string, string>,
            options?: { page_number?: number; page_size?: number },
          ) => use_cases.list({ ...filter_override, ...filter }, options),
        }
      : {}),
    ...(use_cases.get_by_id
      ? {
          get_by_id: async (id: string) => use_cases.get_by_id(id),
        }
      : {}),
  };
}

export function build_list_view_callbacks(
  disabled_functionalities: CrudFunctionality[],
  entity_type: string,
  handlers: {
    handle_create_requested: () => void;
    handle_edit_requested: (entity: BaseEntity) => void;
    handle_entity_deleted: (entity: BaseEntity) => void;
  },
): EntityViewCallbacks {
  console.debug(
    `[EntityCrudWrapper] Building list view callbacks for ${entity_type}, disabled:`,
    disabled_functionalities,
  );
  return {
    ...(!is_functionality_disabled("create", disabled_functionalities)
      ? { on_create_requested: handlers.handle_create_requested }
      : {}),
    ...(!is_functionality_disabled("edit", disabled_functionalities)
      ? { on_edit_requested: handlers.handle_edit_requested }
      : {}),
    ...(!is_functionality_disabled("delete", disabled_functionalities)
      ? { on_delete_completed: handlers.handle_entity_deleted }
      : {}),
  };
}

export function build_form_view_callbacks(handlers: {
  handle_save_completed: (entity: BaseEntity, is_new: boolean) => void;
  handle_form_cancelled: () => void;
}): EntityViewCallbacks {
  return {
    on_save_completed: handlers.handle_save_completed,
    on_cancel: handlers.handle_form_cancelled,
  };
}
