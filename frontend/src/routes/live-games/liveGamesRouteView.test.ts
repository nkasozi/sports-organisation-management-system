import { describe, expect, it } from "vitest";

import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import {
  begin_live_games_fixture_refresh,
  create_initializing_live_games_view_state,
  settle_live_games_fixture_load,
} from "$lib/presentation/logic/liveGamesPageStateMachine";

import {
  create_empty_live_games_fixture_state,
  derive_live_games_route_view,
} from "./liveGamesRouteView";

const LOADED_FIXTURES = {
  ...create_empty_live_games_fixture_state(),
  team_names: { "team-1": "Lions" },
};

describe("derive_live_games_route_view", () => {
  it("shows the page spinner while initializing", () => {
    expect(
      derive_live_games_route_view(
        create_initializing_live_games_view_state(),
        "",
      ),
    ).toMatchObject({ is_loading: true, is_loading_fixtures: false });
  });

  it("keeps showing previous fixtures while refreshing", () => {
    const view = derive_live_games_route_view(
      begin_live_games_fixture_refresh(LOADED_FIXTURES),
      "",
    );
    expect(view.is_loading_fixtures).toBe(true);
    expect(view.fixture_state).toEqual(LOADED_FIXTURES);
  });

  it("shows loaded fixtures and any action error when ready", () => {
    const view = derive_live_games_route_view(
      settle_live_games_fixture_load(create_success_result(LOADED_FIXTURES)),
      "Not allowed",
    );
    expect(view).toMatchObject({
      is_loading: false,
      error_message: "Not allowed",
      fixture_state: LOADED_FIXTURES,
    });
  });

  it("shows the failure message instead of an empty list when a refresh fails", () => {
    const view = derive_live_games_route_view(
      settle_live_games_fixture_load(
        create_failure_result("We couldn't load today's games."),
      ),
      "",
    );
    expect(view.error_message).toBe("We couldn't load today's games.");
    expect(view.is_loading_fixtures).toBe(false);
  });
});
