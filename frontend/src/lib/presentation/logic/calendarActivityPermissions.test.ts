import { describe, expect, it } from "vitest";

import { ANY_VALUE } from "$lib/core/interfaces/ports";
import type { AuthProfileState } from "$lib/presentation/stores/authTypes";

import {
  build_calendar_activity_permissions,
  CALENDAR_PAGE_SUBTITLES,
  can_user_create_calendar_activities,
  resolve_calendar_page_subtitle,
  should_show_calendar_activity_delete_button,
} from "./calendarActivityPermissions";

function create_profile_state(role: string): AuthProfileState {
  return {
    status: "present",
    profile: {
      id: `${role}-id`,
      display_name: role,
      email: "",
      role,
      organization_id: ANY_VALUE,
      organization_name: "",
      team_id: ANY_VALUE,
    },
  } as unknown as AuthProfileState;
}

const READ_ONLY_PERMISSIONS = {
  can_create_activity: false,
  can_edit_activity: false,
  can_delete_activity: false,
  can_create_category: false,
};

const FULL_PERMISSIONS = {
  can_create_activity: true,
  can_edit_activity: true,
  can_delete_activity: true,
  can_create_category: true,
};

describe("calendarActivityPermissions", () => {
  it("makes the calendar read only for the public viewer", () => {
    expect(
      build_calendar_activity_permissions(
        create_profile_state("public_viewer"),
      ),
    ).toEqual(READ_ONLY_PERMISSIONS);
  });

  it("makes the calendar read only when there is no profile", () => {
    expect(build_calendar_activity_permissions({ status: "missing" })).toEqual(
      READ_ONLY_PERMISSIONS,
    );
  });

  it("makes the calendar read only for an unknown role", () => {
    expect(
      build_calendar_activity_permissions(create_profile_state("hacker")),
    ).toEqual(READ_ONLY_PERMISSIONS);
  });

  it("keeps full calendar management for administrators", () => {
    expect(
      build_calendar_activity_permissions(create_profile_state("super_admin")),
    ).toEqual(FULL_PERMISSIONS);
    expect(
      build_calendar_activity_permissions(create_profile_state("org_admin")),
    ).toEqual(FULL_PERMISSIONS);
  });

  it("follows the role permission matrix for managers", () => {
    expect(
      build_calendar_activity_permissions(
        create_profile_state("officials_manager"),
      ),
    ).toEqual({
      can_create_activity: true,
      can_edit_activity: true,
      can_delete_activity: false,
      can_create_category: true,
    });
    expect(
      build_calendar_activity_permissions(create_profile_state("team_manager"))
        .can_create_activity,
    ).toBe(false);
  });

  it("only lets a user add activities when both the role and the scope allow it", () => {
    const admin_scope = {
      status: "present",
      profile: { organization_id: ANY_VALUE, team_id: ANY_VALUE },
    } as never;
    expect(
      can_user_create_calendar_activities(admin_scope, FULL_PERMISSIONS),
    ).toBe(true);
    expect(
      can_user_create_calendar_activities(admin_scope, READ_ONLY_PERMISSIONS),
    ).toBe(false);
    expect(
      can_user_create_calendar_activities(
        { status: "missing" },
        FULL_PERMISSIONS,
      ),
    ).toBe(false);
  });

  it("uses a view-only subtitle for read-only users", () => {
    expect(resolve_calendar_page_subtitle(READ_ONLY_PERMISSIONS)).toBe(
      CALENDAR_PAGE_SUBTITLES.READ_ONLY,
    );
    expect(CALENDAR_PAGE_SUBTITLES.READ_ONLY).toBe(
      "View activities, competitions and fixtures",
    );
    expect(resolve_calendar_page_subtitle(FULL_PERMISSIONS)).toBe(
      CALENDAR_PAGE_SUBTITLES.MANAGE,
    );
    expect(
      resolve_calendar_page_subtitle({
        ...READ_ONLY_PERMISSIONS,
        can_create_category: true,
      }),
    ).toBe(CALENDAR_PAGE_SUBTITLES.MANAGE);
  });

  it("shows the delete button only for manual activities the role may delete", () => {
    expect(should_show_calendar_activity_delete_button("manual", true)).toBe(
      true,
    );
    expect(should_show_calendar_activity_delete_button("manual", false)).toBe(
      false,
    );
    expect(
      should_show_calendar_activity_delete_button("competition", true),
    ).toBe(false);
    expect(should_show_calendar_activity_delete_button("", true)).toBe(false);
  });
});
