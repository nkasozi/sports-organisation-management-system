import { describe, expect, it } from "vitest";

import type { FixtureDetailsSetupUseCases } from "../usecases/FixtureDetailsSetupUseCases";
import { check_fixture_can_start } from "./fixtureStartChecks";
import { CHECK_STATUS } from "./FixtureStartChecksConstants";
import { create_test_fixture } from "./fixtureStartChecksEntities.test_support";
import { create_mock_lineup_use_cases } from "./fixtureStartChecksUseCaseMocks.test_support";

function create_setup_use_cases(
  assigned_officials: Array<{ official_id: string; role_id: string }>,
): FixtureDetailsSetupUseCases {
  return {
    list_by_fixture: async () => ({
      success: true,
      data: {
        items: [{ id: "setup-1", fixture_id: "fixture-1", assigned_officials }],
        total_count: 1,
        page_number: 1,
        page_size: 10,
        total_pages: 1,
      },
    }),
  } as unknown as FixtureDetailsSetupUseCases;
}

describe("pre-flight officials check counts the officials in the setup", () => {
  it("reports every official assigned in the fixture details setup", async () => {
    const result = await check_fixture_can_start(
      create_test_fixture({ id: "fixture-1" } as never),
      create_setup_use_cases(
        ["o1", "o2", "o3", "o4", "o5", "o6"].map((official_id) => ({
          official_id,
          role_id: "role",
        })),
      ),
      create_mock_lineup_use_cases([]),
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.officials_check.message).toBe("6 official(s) assigned");
  });

  it("fails when the setup exists but assigns no officials", async () => {
    const result = await check_fixture_can_start(
      create_test_fixture({ id: "fixture-1" } as never),
      create_setup_use_cases([]),
      create_mock_lineup_use_cases([]),
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.officials_check.status).toBe(CHECK_STATUS.FAILED);
  });
});
