import { describe, expect, it, type Mock, vi } from "vitest";

import type { AuthState } from "$lib/presentation/stores/authTypes";

import {
  build_profile_management_controller_authorization_filter,
  PROFILE_MANAGEMENT_PAGE_MESSAGES,
  type ProfileManagementAccessDependencies,
  resolve_profile_management_access,
} from "./profileManagementPageControllerLogic";

vi.mock("$lib/presentation/logic/profileManagementPageState", async () => {
  const actual = await vi.importActual<
    typeof import("$lib/presentation/logic/profileManagementPageState")
  >("$lib/presentation/logic/profileManagementPageState");
  return {
    ...actual,
    build_profile_management_permissions: (role: string) => ({
      can_read: role === "reader",
      can_create: false,
      can_edit: false,
      can_delete: false,
    }),
  };
});

const CONFIGURATION = {
  normalized_entity_type: "playerprofile",
  access_denial_path: "/player-profiles",
  access_denial_message: "No access",
  authorization_filter_fields: ["organization_id"],
};

function create_auth_state(role: string): AuthState {
  return {
    current_token: { status: "present", token: { raw_token: "raw-token" } },
    current_profile: {
      status: "present",
      profile: { id: "profile-1", role, organization_id: "org-1" },
    },
  } as unknown as AuthState;
}

function create_dependencies(
  auth_state: AuthState,
  ensure_result:
    | { success: true }
    | { success: false; error_message: string } = {
    success: true,
  },
): ProfileManagementAccessDependencies & {
  check_entity_authorized: Mock<
    ProfileManagementAccessDependencies["check_entity_authorized"]
  >;
  set_access_denial: Mock<
    ProfileManagementAccessDependencies["set_access_denial"]
  >;
  navigate_home: Mock<ProfileManagementAccessDependencies["navigate_home"]>;
} {
  return {
    ensure_auth_profile: async () => ensure_result,
    get_auth_state: () => auth_state,
    check_entity_authorized: vi
      .fn<ProfileManagementAccessDependencies["check_entity_authorized"]>()
      .mockResolvedValue({ success: true }),
    set_access_denial:
      vi.fn<ProfileManagementAccessDependencies["set_access_denial"]>(),
    navigate_home:
      vi.fn<ProfileManagementAccessDependencies["navigate_home"]>(),
  };
}

describe("profileManagementPageControllerLogic", () => {
  it("fails with the auth guard error or when no token and profile are present", async () => {
    await expect(
      resolve_profile_management_access(
        CONFIGURATION,
        create_dependencies(create_auth_state("reader"), {
          success: false,
          error_message: "auth failed",
        }),
      ),
    ).resolves.toEqual({ status: "failed", error_message: "auth failed" });

    await expect(
      resolve_profile_management_access(
        CONFIGURATION,
        create_dependencies({
          current_token: { status: "missing" },
          current_profile: { status: "missing" },
        } as unknown as AuthState),
      ),
    ).resolves.toEqual({
      status: "failed",
      error_message: PROFILE_MANAGEMENT_PAGE_MESSAGES.NO_USER_PROFILE,
    });
  });

  it("grants access with the role permissions when the role can read", async () => {
    const dependencies = create_dependencies(create_auth_state("reader"));
    const outcome = await resolve_profile_management_access(
      CONFIGURATION,
      dependencies,
    );

    expect(outcome).toEqual({
      status: "granted",
      permissions: {
        can_read: true,
        can_create: false,
        can_edit: false,
        can_delete: false,
      },
    });
    expect(dependencies.set_access_denial).not.toHaveBeenCalled();
  });

  it("records the denial and navigates home when the role cannot read", async () => {
    const dependencies = create_dependencies(create_auth_state("viewer"));

    await expect(
      resolve_profile_management_access(CONFIGURATION, dependencies),
    ).resolves.toEqual({ status: "denied" });
    expect(dependencies.check_entity_authorized).toHaveBeenCalledWith(
      "raw-token",
      "playerprofile",
      "read",
    );
    expect(dependencies.set_access_denial).toHaveBeenCalledWith(
      "/player-profiles",
      "No access",
    );
    expect(dependencies.navigate_home).toHaveBeenCalledWith("/");
  });

  it("builds an empty authorization filter when no profile is present", () => {
    expect(
      build_profile_management_controller_authorization_filter(
        { current_profile: { status: "missing" } } as unknown as AuthState,
        CONFIGURATION,
      ),
    ).toEqual({});
  });
});
