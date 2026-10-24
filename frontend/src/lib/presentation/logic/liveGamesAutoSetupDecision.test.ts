import { describe, expect, it, vi } from "vitest";

import {
  AUTO_SETUP_DECISION,
  decide_competition_auto_setup,
} from "./liveGamesAutoSetupDecision";

const FIXTURE = { id: "fixture-1", competition_id: "competition-1" } as never;

function create_competition_use_cases(
  result: unknown,
): Parameters<typeof decide_competition_auto_setup>[1] {
  return { get_by_id: vi.fn(async () => result) } as never;
}

describe("decide_competition_auto_setup", () => {
  it("allows auto setup when the competition has it switched on", async () => {
    const competition_use_cases = create_competition_use_cases({
      success: true,
      data: { id: "competition-1", allow_auto_fixture_details_setup: true },
    });

    expect(
      await decide_competition_auto_setup(FIXTURE, competition_use_cases),
    ).toEqual({ status: AUTO_SETUP_DECISION.ALLOWED });
    expect(competition_use_cases.get_by_id).toHaveBeenCalledWith(
      "competition-1",
    );
  });

  it("reports auto setup as switched off when the competition does not allow it", async () => {
    expect(
      await decide_competition_auto_setup(
        FIXTURE,
        create_competition_use_cases({
          success: true,
          data: {
            id: "competition-1",
            allow_auto_fixture_details_setup: false,
          },
        }),
      ),
    ).toEqual({ status: AUTO_SETUP_DECISION.DISABLED });
  });

  it("treats a competition saved before the setting existed as switched off", async () => {
    expect(
      await decide_competition_auto_setup(
        FIXTURE,
        create_competition_use_cases({
          success: true,
          data: { id: "competition-1" },
        }),
      ),
    ).toEqual({ status: AUTO_SETUP_DECISION.DISABLED });
  });

  it("reports a failed competition lookup instead of pretending auto setup is off", async () => {
    expect(
      await decide_competition_auto_setup(
        FIXTURE,
        create_competition_use_cases({
          success: false,
          error: "Competition not found",
        }),
      ),
    ).toEqual({
      status: AUTO_SETUP_DECISION.LOOKUP_FAILED,
      error: "Competition not found",
    });
  });
});
