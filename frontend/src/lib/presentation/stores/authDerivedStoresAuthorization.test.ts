import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  AuthorizableAction,
  AuthorizationCheckResult,
  EntityAuthorizationMap,
} from "$lib/core/interfaces/ports";

import {
  check_action_authorization,
  get_disabled_crud_actions,
  get_entity_authorization_level,
} from "./authDerivedStores";
import {
  auth_store_mock,
  reset_auth_derived_store_mocks,
} from "./authDerivedStores.test_support";

vi.mock("$lib/core/interfaces/ports", async () => ({
  USER_ROLE_DISPLAY_NAMES: {
    org_admin: "Organization Admin",
    public_viewer: "Public Viewer",
  },
  check_data_permission: (await import("./authDerivedStores.test_support"))
    .authorization_ports_mock.check_data_permission,
}));

vi.mock("./authStoreCore", async () => ({
  auth_store: (await import("./authDerivedStores.test_support")).auth_store_mock
    .auth_store,
}));

describe("authDerivedStores", () => {
  beforeEach(() => {
    reset_auth_derived_store_mocks();
  });

  it("delegates authorization helper calls to the auth store", () => {
    const authorization_level = {
      entity_type: "players",
      authorizations: new Map([["view", "organization"]]),
    } as EntityAuthorizationMap;
    const authorization_result = {
      is_authorized: true,
      authorization_level: "full",
    } as AuthorizationCheckResult;
    const disabled_actions = ["delete"] as AuthorizableAction[];

    auth_store_mock.get_authorization_level.mockReturnValue(
      authorization_level,
    );
    auth_store_mock.is_authorized_to_execute.mockReturnValue(
      authorization_result,
    );
    auth_store_mock.get_disabled_functionalities.mockReturnValue(
      disabled_actions,
    );

    expect(get_entity_authorization_level("players")).toBe(authorization_level);
    expect(
      check_action_authorization(
        "view",
        "players",
        "player-1",
        "organization-1",
        "team-1",
      ),
    ).toBe(authorization_result);
    expect(get_disabled_crud_actions("players")).toEqual(disabled_actions);
    expect(auth_store_mock.get_authorization_level).toHaveBeenCalledWith(
      "players",
    );
    expect(auth_store_mock.is_authorized_to_execute).toHaveBeenCalledWith(
      "view",
      "players",
      "player-1",
      "organization-1",
      "team-1",
    );
    expect(auth_store_mock.get_disabled_functionalities).toHaveBeenCalledWith(
      "players",
    );
  });
});
