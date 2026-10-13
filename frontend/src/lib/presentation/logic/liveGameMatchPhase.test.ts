import { describe, expect, it } from "vitest";

import {
  derive_live_match_phase,
  LIVE_MATCH_PHASE,
} from "./liveGameMatchPhase";

describe("derive_live_match_phase", () => {
  it.each([
    ["scheduled", "pre_game", LIVE_MATCH_PHASE.NOT_STARTED],
    ["in_progress", "first_half", LIVE_MATCH_PHASE.IN_PLAY],
    ["in_progress", "half_time", LIVE_MATCH_PHASE.IN_PLAY],
    ["in_progress", "finished", LIVE_MATCH_PHASE.AWAITING_FULL_TIME],
    ["completed", "finished", LIVE_MATCH_PHASE.COMPLETED],
    ["postponed", "pre_game", LIVE_MATCH_PHASE.INACTIVE],
    ["cancelled", "pre_game", LIVE_MATCH_PHASE.INACTIVE],
  ])("maps %s in %s to %s", (status, current_period, phase) => {
    expect(derive_live_match_phase({ status, current_period } as never)).toBe(
      phase,
    );
  });
});
