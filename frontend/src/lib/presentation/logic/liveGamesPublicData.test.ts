import { describe, expect, it, vi } from "vitest";

import { create_present_auth_profile_state } from "$lib/presentation/stores/authTypes";

import {
  create_auth_state,
  create_fixture_state_dependencies,
} from "./liveGamesPageFlow.test_support";
import { initialize_live_games_page } from "./liveGamesPageState";

function create_public_viewer_state(): ReturnType<typeof create_auth_state> {
  return create_auth_state({
    current_profile: create_present_auth_profile_state({
      id: "public_viewer",
      display_name: "Public Viewer",
      email: "",
      role: "public_viewer",
      organization_id: "*",
      organization_name: "",
      team_id: "",
    } as never),
  });
}

type DependenciesWithPublicLoader = ReturnType<
  typeof create_fixture_state_dependencies
> & {
  load_public_live_games_data: ReturnType<
    typeof vi.fn<() => Promise<{ success: boolean }>>
  >;
};

function create_dependencies_with_public_loader(): DependenciesWithPublicLoader {
  const load_public_live_games_data = vi.fn(async () => ({ success: true }));
  return {
    ...create_fixture_state_dependencies(),
    load_public_live_games_data,
  };
}

async function initialize_for(
  auth_state: ReturnType<typeof create_auth_state>,
  dependencies: DependenciesWithPublicLoader,
): ReturnType<typeof initialize_live_games_page> {
  return initialize_live_games_page({
    search_parameters: new URLSearchParams(""),
    ensure_auth_profile: async () => ({ success: true, error_message: "" }),
    auth_state,
    authorization_adapter: {
      check_entity_authorized: async () => ({
        success: true,
        data: { is_authorized: true, role: "org_admin" },
      }),
    },
    organization_use_cases: dependencies.organization_use_cases,
    fixture_state_dependencies: dependencies as never,
  });
}

describe("live games for the public viewer read the server's real data", () => {
  it("fetches the organization list, then the chosen organization's games", async () => {
    const dependencies = create_dependencies_with_public_loader();

    const result = await initialize_for(
      create_public_viewer_state(),
      dependencies,
    );

    expect(result.status).toBe("ready");
    expect(dependencies.load_public_live_games_data.mock.calls).toEqual([
      [{ status: "none" }],
      [{ status: "some", value: "org_1" }],
    ]);
  });

  it("does not fetch public data for a signed-in member", async () => {
    const dependencies = create_dependencies_with_public_loader();

    await initialize_for(create_auth_state(), dependencies);

    expect(dependencies.load_public_live_games_data).not.toHaveBeenCalled();
  });
});
