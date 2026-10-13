import { describe, expect, it } from "vitest";

import { create_none_option, create_some_option } from "$lib/core/types/Option";
import type { ProfileManagementEntity } from "$lib/presentation/logic/profileManagementPageState";

import {
  create_profile_management_create_state,
  create_profile_management_edit_state,
  create_profile_management_list_state,
  get_profile_management_editor_entity,
  get_profile_management_list_notice,
  PROFILE_MANAGEMENT_LOAD_STATUS,
} from "./profileManagementPageStatus";

const profile = { id: "profile-1" } as ProfileManagementEntity;

describe("profile management editor state", () => {
  it("only exposes an entity while editing", () => {
    expect(
      get_profile_management_editor_entity(
        create_profile_management_edit_state(profile),
      ),
    ).toEqual(create_some_option(profile));
    expect(
      get_profile_management_editor_entity(
        create_profile_management_create_state(),
      ),
    ).toEqual(create_none_option());
    expect(
      get_profile_management_editor_entity(
        create_profile_management_list_state(),
      ),
    ).toEqual(create_none_option());
  });
});

describe("get_profile_management_list_notice", () => {
  it("shows the load failure message over action notices", () => {
    expect(
      get_profile_management_list_notice(
        {
          status: PROFILE_MANAGEMENT_LOAD_STATUS.FAILED,
          message: "Load failed",
        },
        "Denied",
      ),
    ).toBe("Load failed");
  });

  it("shows action notices once loaded", () => {
    expect(
      get_profile_management_list_notice(
        { status: PROFILE_MANAGEMENT_LOAD_STATUS.READY },
        "Denied",
      ),
    ).toBe("Denied");
  });
});
