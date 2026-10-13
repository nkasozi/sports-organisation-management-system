import { describe, expect, it } from "vitest";

import {
  GAME_EVENT_TEAM_SIDE,
  GAME_EVENT_TEAM_SIDE_STYLE,
  get_selected_team_side_class,
  get_selected_team_side_label,
} from "./gameDisplayConstants";

describe("game event team side display", () => {
  it("styles and labels the home side", () => {
    expect(get_selected_team_side_class(GAME_EVENT_TEAM_SIDE.HOME)).toBe(
      GAME_EVENT_TEAM_SIDE_STYLE.HOME_TEXT,
    );
    expect(
      get_selected_team_side_label(
        GAME_EVENT_TEAM_SIDE.HOME,
        "Lions",
        "Tigers",
      ),
    ).toBe("🏠 Lions");
  });

  it("styles and labels the away side", () => {
    expect(get_selected_team_side_class(GAME_EVENT_TEAM_SIDE.AWAY)).toBe(
      GAME_EVENT_TEAM_SIDE_STYLE.AWAY_TEXT,
    );
    expect(
      get_selected_team_side_label(
        GAME_EVENT_TEAM_SIDE.AWAY,
        "Lions",
        "Tigers",
      ),
    ).toBe("✈️ Tigers");
  });
});
