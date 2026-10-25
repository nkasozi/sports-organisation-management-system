import { describe, expect, it } from "vitest";

import { should_watch_live_game } from "./liveGameDetailSpectatorRefresh";

describe("who keeps a live game refreshed", () => {
  it("refreshes for people watching, not for those running the game", () => {
    expect(should_watch_live_game(false)).toBe(true);
    expect(should_watch_live_game(true)).toBe(false);
  });
});
