import { beforeEach, describe, expect, it, vi } from "vitest";

import { load_dynamic_entity_list_entities } from "./dynamicEntityListRecords";

const {
  apply_id_filter_to_entities_mock,
  build_entity_authorization_filter_mock,
  build_filter_from_sub_entity_config_mock,
  check_entity_authorized_mock,
  extract_error_message_from_result_mock,
  extract_items_from_result_data_mock,
  get_use_cases_for_entity_type_mock,
  merge_entity_list_filters_mock,
} = vi.hoisted(() => ({
  apply_id_filter_to_entities_mock: vi.fn(),
  build_entity_authorization_filter_mock: vi.fn(),
  build_filter_from_sub_entity_config_mock: vi.fn(),
  check_entity_authorized_mock: vi.fn(),
  extract_error_message_from_result_mock: vi.fn(),
  extract_items_from_result_data_mock: vi.fn(),
  get_use_cases_for_entity_type_mock: vi.fn(),
  merge_entity_list_filters_mock: vi.fn(),
}));

vi.mock("$lib/infrastructure/AuthorizationProvider", () => ({
  get_authorization_adapter: () => ({
    check_entity_authorized: check_entity_authorized_mock,
  }),
}));

vi.mock("$lib/infrastructure/registry/entityUseCasesRegistry", () => ({
  get_use_cases_for_entity_type: get_use_cases_for_entity_type_mock,
}));

vi.mock("$lib/presentation/logic/dynamicListLogic", () => ({
  apply_id_filter_to_entities: apply_id_filter_to_entities_mock,
  build_entity_authorization_filter: build_entity_authorization_filter_mock,
  build_filter_from_sub_entity_config: build_filter_from_sub_entity_config_mock,
  extract_error_message_from_result: extract_error_message_from_result_mock,
  extract_items_from_result_data: extract_items_from_result_data_mock,
  merge_entity_list_filters: merge_entity_list_filters_mock,
}));

describe("dynamicEntityListRecords read access", () => {
  beforeEach(() => {
    apply_id_filter_to_entities_mock.mockReset();
    build_entity_authorization_filter_mock.mockReset();
    build_filter_from_sub_entity_config_mock.mockReset();
    check_entity_authorized_mock.mockReset();
    extract_error_message_from_result_mock.mockReset();
    extract_items_from_result_data_mock.mockReset();
    get_use_cases_for_entity_type_mock.mockReset();
    merge_entity_list_filters_mock.mockReset();
  });

  it("denies reads when the authorization check itself fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    build_entity_authorization_filter_mock.mockReturnValueOnce({
      status: "ready",
      filter_state: { status: "present", filter: {} },
    });
    check_entity_authorized_mock.mockResolvedValueOnce({
      success: false,
      error: "Token could not be verified",
    });

    await expect(
      load_dynamic_entity_list_entities({
        current_profile_state: {
          status: "present",
          profile: { organization_id: "org-1" } as never,
        },
        display_name: "Teams",
        entity_metadata: { fields: [] } as never,
        entity_type: "team",
        raw_token: "token-1",
      }),
    ).resolves.toEqual({
      auth_profile_missing: false,
      entities: [],
      error_message:
        "We couldn't confirm you can view Teams right now. Please try again.",
    });
    expect(get_use_cases_for_entity_type_mock).not.toHaveBeenCalled();
  });

  it("applies public viewer permissions when there is no token", async () => {
    build_entity_authorization_filter_mock.mockReturnValueOnce({
      status: "ready",
      filter_state: { status: "present", filter: {} },
    });

    await expect(
      load_dynamic_entity_list_entities({
        current_profile_state: {
          status: "present",
          profile: { organization_id: "org-1" } as never,
        },
        display_name: "System Users",
        entity_metadata: { fields: [] } as never,
        entity_type: "systemuser",
        raw_token: "",
      }),
    ).resolves.toEqual({
      auth_profile_missing: false,
      entities: [],
      error_message:
        "Access denied: Your role does not have permission to view System Users data.",
    });
    expect(check_entity_authorized_mock).not.toHaveBeenCalled();
    expect(get_use_cases_for_entity_type_mock).not.toHaveBeenCalled();
  });

  it("lets a tokenless public viewer read publicly readable entities", async () => {
    const list = vi.fn().mockResolvedValueOnce({ success: true, data: [] });
    build_entity_authorization_filter_mock.mockReturnValueOnce({
      status: "ready",
      filter_state: { status: "present", filter: {} },
    });
    merge_entity_list_filters_mock.mockReturnValueOnce({});
    extract_items_from_result_data_mock.mockReturnValueOnce([]);
    apply_id_filter_to_entities_mock.mockReturnValueOnce([]);

    await load_dynamic_entity_list_entities({
      crud_handlers: { list } as never,
      current_profile_state: {
        status: "present",
        profile: { organization_id: "org-1" } as never,
      },
      display_name: "Competitions",
      entity_metadata: { fields: [] } as never,
      entity_type: "competition",
      raw_token: "",
    });

    expect(list).toHaveBeenCalledTimes(1);
    expect(check_entity_authorized_mock).not.toHaveBeenCalled();
  });
});
