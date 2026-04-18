import { describe, expect, it } from "vitest";

import type { BaseEntity } from "$lib/core/entities/BaseEntity";
import { ANY_VALUE, type UserScopeProfile } from "$lib/core/interfaces/ports";
import type { ScalarInput } from "$lib/core/types/DomainScalars";

import {
  build_profile_management_authorization_filter,
  build_profile_management_options,
  build_profile_management_permissions,
  build_profile_management_preview_path,
  build_profile_management_rows,
  get_profile_management_status_badge_class,
  get_profile_management_visibility_badge_class,
  type ProfileManagementEntity,
} from "./profileManagementPageState";

function create_scope_profile(
  overrides: Partial<ScalarInput<UserScopeProfile>> = {},
): UserScopeProfile {
  return {
    organization_id: "org_1",
    team_id: "team_1",
    player_id: "player_1",
    ...overrides,
  } as UserScopeProfile;
}

function create_related_entity(
  overrides: Partial<ScalarInput<BaseEntity>> = {},
): BaseEntity {
  return {
    id: "related_1",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as BaseEntity;
}

function create_profile_entity(
  overrides: Partial<ScalarInput<ProfileManagementEntity>> = {},
): ProfileManagementEntity {
  return {
    id: "profile_1",
    profile_slug: "sample-profile",
    visibility: "public",
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as ProfileManagementEntity;
}

describe("profileManagementPageState", () => {
  it("builds an authorization filter from the restricted profile scope", () => {
    const result = build_profile_management_authorization_filter(
      {
        status: "present",
        profile: create_scope_profile({ player_id: ANY_VALUE }),
      },
      ["organization_id", "team_id", "player_id"],
    );

    expect(result).toEqual({
      organization_id: "org_1",
      team_id: "team_1",
    });
  });

  it("skips unrestricted scope values when building authorization filters", () => {
    const result = build_profile_management_authorization_filter(
      {
        status: "present",
        profile: create_scope_profile({
          organization_id: ANY_VALUE,
          team_id: ANY_VALUE,
        }),
      },
      ["organization_id", "team_id"],
    );

    expect(result).toEqual({});
  });

  it("returns an empty filter when the authorization profile is missing", () => {
    const result = build_profile_management_authorization_filter(
      { status: "missing" },
      ["organization_id", "team_id"],
    );

    expect(result).toEqual({});
  });

  it("builds related entity options with custom labels", () => {
    const result = build_profile_management_options(
      [
        create_related_entity({ id: "team_1", name: "Lions" } as never),
        create_related_entity({ id: "team_2", name: "Tigers" } as never),
      ],
      (entity) => (entity as BaseEntity & { name: string }).name,
    );

    expect(result).toEqual([
      { value: "team_1", label: "Lions" },
      { value: "team_2", label: "Tigers" },
    ]);
  });

  it("builds table rows and falls back to the related entity id when no label exists", () => {
    const result = build_profile_management_rows(
      [
        create_profile_entity({
          id: "profile_1",
          related_entity_id: "team_1",
        } as never),
        create_profile_entity({
          id: "profile_2",
          related_entity_id: "team_2",
        } as never),
      ],
      [{ value: "team_1", label: "Lions" }],
      (profile) =>
        (profile as ProfileManagementEntity & { related_entity_id: string })
          .related_entity_id,
    );

    expect(result.map((row) => row.subject_name)).toEqual(["Lions", "team_2"]);
    expect(result[0].profile_slug).toBe("sample-profile");
  });

  it("returns disabled permissions when no role is available", () => {
    const result = build_profile_management_permissions(void 0, "teamprofile");

    expect(result).toEqual({
      can_read: false,
      can_create: false,
      can_edit: false,
      can_delete: false,
    });
  });

  it("returns consistent badge classes and preview paths", () => {
    expect(get_profile_management_visibility_badge_class("public")).toContain(
      "bg-green-100",
    );
    expect(get_profile_management_visibility_badge_class("private")).toContain(
      "bg-accent-100",
    );
    expect(get_profile_management_status_badge_class("active")).toContain(
      "bg-green-100",
    );
    expect(get_profile_management_status_badge_class("inactive")).toContain(
      "bg-accent-100",
    );
    expect(
      build_profile_management_preview_path("/profile", "sam-player"),
    ).toBe("/profile/sam-player");
    expect(build_profile_management_preview_path("/profile", "")).toBe("");
  });
});
