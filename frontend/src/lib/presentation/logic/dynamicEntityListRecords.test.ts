import { beforeEach, describe, expect, it, vi } from "vitest";

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

import {
  load_dynamic_entity_list_entities,
  load_dynamic_entity_list_filter_options,
} from "./dynamicEntityListRecords";

describe("dynamicEntityListRecords", () => {
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

  it("loads foreign-key filter options and leaves missing registries empty", async () => {
    const list = vi
      .fn()
      .mockResolvedValueOnce({ success: true, data: [{ id: "team-1" }] });

    get_use_cases_for_entity_type_mock
      .mockReturnValueOnce({ success: true, data: { list } })
      .mockReturnValueOnce({ success: false });
    extract_items_from_result_data_mock.mockReturnValueOnce([{ id: "team-1" }]);

    await expect(
      load_dynamic_entity_list_filter_options([
        {
          field_name: "team_id",
          field_type: "foreign_key",
          foreign_key_entity: "team",
        },
        { field_name: "name", field_type: "string" },
        {
          field_name: "venue_id",
          field_type: "foreign_key",
          foreign_key_entity: "venue",
        },
      ] as never),
    ).resolves.toEqual({
      team_id: [{ id: "team-1" }],
      venue_id: [],
    });
  });

  it("returns an error when metadata is missing", async () => {
    await expect(
      load_dynamic_entity_list_entities({
        crud_handlers: null,
        current_profile: null,
        display_name: "Teams",
        entity_metadata: null,
        entity_type: "team",
        raw_token: null,
        sub_entity_filter: null,
      }),
    ).resolves.toEqual({
      auth_profile_missing: false,
      entities: [],
      error_message: "No metadata found for entity type: team",
    });
  });

  it("stops loading when the user scope profile is missing", async () => {
    build_entity_authorization_filter_mock.mockReturnValueOnce({
      profile_missing: true,
      filter: {},
    });

    await expect(
      load_dynamic_entity_list_entities({
        crud_handlers: null,
        current_profile: null,
        display_name: "Teams",
        entity_metadata: { fields: [] } as never,
        entity_type: "team",
        raw_token: null,
        sub_entity_filter: null,
      }),
    ).resolves.toEqual({
      auth_profile_missing: true,
      entities: [],
      error_message:
        "Unable to load data: No user profile is set. Please select a user profile to continue.",
    });
  });

  it("blocks unauthorized reads when the token cannot access the entity type", async () => {
    build_entity_authorization_filter_mock.mockReturnValueOnce({
      profile_missing: false,
      filter: { organization_id: "org-1" },
    });
    check_entity_authorized_mock.mockResolvedValueOnce({
      success: true,
      data: { is_authorized: false },
    });

    await expect(
      load_dynamic_entity_list_entities({
        crud_handlers: null,
        current_profile: { organization_id: "org-1" } as never,
        display_name: "Team Memberships",
        entity_metadata: { fields: [] } as never,
        entity_type: "Player Team_Membership",
        raw_token: "token-1",
        sub_entity_filter: null,
      }),
    ).resolves.toEqual({
      auth_profile_missing: false,
      entities: [],
      error_message:
        "Access denied: Your role does not have permission to view Team Memberships data.",
    });
    expect(check_entity_authorized_mock).toHaveBeenCalledWith(
      "token-1",
      "playerteammembership",
      "read",
    );
  });

  it("loads entities through custom handlers and applies the merged filter", async () => {
    const filtered_entities = [{ id: "entity-1" }];
    const list = vi
      .fn()
      .mockResolvedValueOnce({ success: true, data: filtered_entities });

    build_entity_authorization_filter_mock.mockReturnValueOnce({
      profile_missing: false,
      filter: { organization_id: "org-1" },
    });
    build_filter_from_sub_entity_config_mock.mockReturnValueOnce({
      team_id: "team-1",
    });
    merge_entity_list_filters_mock.mockReturnValueOnce({
      organization_id: "org-1",
      team_id: "team-1",
    });
    extract_items_from_result_data_mock.mockReturnValueOnce(filtered_entities);
    apply_id_filter_to_entities_mock.mockReturnValueOnce(filtered_entities);

    await expect(
      load_dynamic_entity_list_entities({
        crud_handlers: { list } as never,
        current_profile: { organization_id: "org-1" } as never,
        display_name: "Teams",
        entity_metadata: { fields: [] } as never,
        entity_type: "team",
        raw_token: null,
        sub_entity_filter: {
          foreign_key_field: "team_id",
          foreign_key_value: "team-1",
        } as never,
      }),
    ).resolves.toEqual({
      auth_profile_missing: false,
      entities: filtered_entities,
      error_message: "",
    });
    expect(list).toHaveBeenCalledWith(
      { organization_id: "org-1", team_id: "team-1" },
      { page_size: 1000 },
    );
  });

  it("falls back to entity use cases and surfaces list errors when custom handlers are absent", async () => {
    build_entity_authorization_filter_mock.mockReturnValueOnce({
      profile_missing: false,
      filter: {},
    });
    build_filter_from_sub_entity_config_mock.mockReturnValueOnce({});
    merge_entity_list_filters_mock.mockReturnValueOnce({});
    extract_error_message_from_result_mock.mockReturnValueOnce("List failed");
    get_use_cases_for_entity_type_mock.mockReturnValueOnce({
      success: true,
      data: {
        list: vi.fn().mockResolvedValueOnce({
          success: false,
          error_message: "List failed",
        }),
      },
    });

    await expect(
      load_dynamic_entity_list_entities({
        crud_handlers: null,
        current_profile: { organization_id: "org-1" } as never,
        display_name: "Teams",
        entity_metadata: { fields: [] } as never,
        entity_type: "team",
        raw_token: null,
        sub_entity_filter: null,
      }),
    ).resolves.toEqual({
      auth_profile_missing: false,
      entities: [],
      error_message: "List failed",
    });
  });
});
