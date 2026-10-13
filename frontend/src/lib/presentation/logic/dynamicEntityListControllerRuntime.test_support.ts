import { vi } from "vitest";

type StoreValue = Record<string, unknown>;
type StoreSubscriber = (value: StoreValue) => void;
type ModuleMock = Record<string, unknown>;

type WritableStoreMock = {
  set: (next_value: StoreValue) => void;
  subscribe: (subscriber: StoreSubscriber) => () => boolean;
  update: (updater: (value: StoreValue) => StoreValue) => void;
};

function create_store(initial_value: StoreValue): WritableStoreMock {
  let current_value = initial_value;
  const subscribers = new Set<StoreSubscriber>();
  return {
    set: (next_value: StoreValue): void => {
      current_value = next_value;
      subscribers.forEach((subscriber) => subscriber(current_value));
    },
    subscribe: (subscriber: StoreSubscriber) => {
      subscriber(current_value);
      subscribers.add(subscriber);
      return () => subscribers.delete(subscriber);
    },
    update: (updater: (value: StoreValue) => StoreValue): void => {
      current_value = updater(current_value);
      subscribers.forEach((subscriber) => subscriber(current_value));
    },
  };
}

function create_signed_in_auth_state(): StoreValue {
  return {
    current_profile: {
      status: "present",
      profile: { organization_id: "org-1" },
    },
    current_token: {
      status: "present",
      token: { raw_token: "token-1" },
    },
  };
}

const auth_store_mock = create_store(create_signed_in_auth_state());
export const build_dynamic_entity_list_view_state_mock = vi.fn();
const create_dynamic_entity_list_controller_crud_actions_mock = vi.fn();
const create_dynamic_entity_list_controller_view_actions_mock = vi.fn();
export const ensure_auth_profile_mock = vi.fn();
export const load_dynamic_entity_list_columns_mock = vi.fn();
export const load_dynamic_entity_list_entities_mock = vi.fn();
export const load_dynamic_entity_list_filter_options_mock = vi.fn();

export function create_auth_guard_module_mock(): ModuleMock {
  return { ensure_auth_profile: ensure_auth_profile_mock };
}

export function create_runtime_crud_module_mock(): ModuleMock {
  return {
    create_dynamic_entity_list_controller_crud_actions:
      create_dynamic_entity_list_controller_crud_actions_mock,
  };
}

export function create_runtime_view_module_mock(): ModuleMock {
  return {
    create_dynamic_entity_list_controller_view_actions:
      create_dynamic_entity_list_controller_view_actions_mock,
  };
}

export function create_state_builder_module_mock(): ModuleMock {
  return {
    build_dynamic_entity_list_view_state:
      build_dynamic_entity_list_view_state_mock,
  };
}

export function create_list_data_module_mock(): ModuleMock {
  return {
    load_dynamic_entity_list_columns: load_dynamic_entity_list_columns_mock,
    load_dynamic_entity_list_entities: load_dynamic_entity_list_entities_mock,
    load_dynamic_entity_list_filter_options:
      load_dynamic_entity_list_filter_options_mock,
  };
}

export function create_auth_store_module_mock(): ModuleMock {
  return { auth_store: auth_store_mock };
}

function reset_runtime_dependency_mocks(): boolean {
  build_dynamic_entity_list_view_state_mock.mockReset();
  create_dynamic_entity_list_controller_crud_actions_mock.mockReset();
  create_dynamic_entity_list_controller_view_actions_mock.mockReset();
  ensure_auth_profile_mock.mockReset();
  load_dynamic_entity_list_columns_mock.mockReset();
  load_dynamic_entity_list_entities_mock.mockReset();
  load_dynamic_entity_list_filter_options_mock.mockReset();
  return true;
}

function install_view_state_builder_mock(): boolean {
  build_dynamic_entity_list_view_state_mock.mockImplementation(
    (options: StoreValue, current_state: StoreValue) => ({
      button_color_class: options.button_color_class,
      columns_restored_from_cache:
        current_state.columns_restored_from_cache ?? false,
      current_page: current_state.current_page ?? 1,
      display_name: current_state.display_name ?? "Teams",
      entities: current_state.entities ?? [],
      entity_metadata: current_state.entity_metadata ?? {
        fields: [{ field_name: "name" }],
      },
      entity_type: options.entity_type,
      error_message: current_state.error_message ?? "",
      foreign_key_options: current_state.foreign_key_options ?? {},
      is_loading: current_state.is_loading ?? false,
      visible_columns: current_state.visible_columns ?? new Set<string>(),
    }),
  );
  return true;
}

function install_controller_action_mocks(): boolean {
  create_dynamic_entity_list_controller_crud_actions_mock.mockReturnValue({
    cancel_deletion: vi.fn(),
    close_bulk_import: vi.fn(),
    confirm_deletion_action: vi.fn(),
    handle_create_new_entity: vi.fn().mockReturnValue(true),
  });
  create_dynamic_entity_list_controller_view_actions_mock.mockReturnValue({
    clear_all_selections: vi.fn(),
    export_to_csv: vi.fn(),
    reset_filters: vi.fn(),
    toggle_sort_by_column: vi.fn(),
  });
  return true;
}

export function reset_dynamic_entity_list_runtime_mocks(): boolean {
  auth_store_mock.set(create_signed_in_auth_state());
  reset_runtime_dependency_mocks();
  install_view_state_builder_mock();
  install_controller_action_mocks();
  return true;
}
