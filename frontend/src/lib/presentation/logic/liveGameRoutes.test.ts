import { describe, expect, it } from "vitest";

import { build_live_game_detail_url } from "./liveGameRoutes";

describe("build_live_game_detail_url", () => {
  it("points at the live game page for the fixture", () => {
    expect(build_live_game_detail_url("fixture_42")).toBe(
      "/live-games/fixture_42",
    );
  });

  it("encodes ids that are not url safe", () => {
    expect(build_live_game_detail_url("a b")).toBe("/live-games/a%20b");
  });
});
