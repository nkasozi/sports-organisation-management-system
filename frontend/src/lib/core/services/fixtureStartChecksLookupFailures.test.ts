import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { FixtureDetailsSetupUseCases } from "../usecases/FixtureDetailsSetupUseCases";
import type { FixtureLineupUseCases } from "../usecases/FixtureLineupUseCases";
import { check_fixture_can_start } from "./fixtureStartChecks";
import {
  FIXTURE_START_CHECKS_EVENT,
  FIXTURE_START_CHECKS_MESSAGES,
} from "./FixtureStartChecksConstants";
import { create_test_fixture } from "./fixtureStartChecksEntities.test_support";
import {
  create_mock_lineup_use_cases,
  create_mock_official_use_cases,
} from "./fixtureStartChecksUseCaseMocks.test_support";

const FAILING_OFFICIALS = {
  list_by_fixture: async () => ({ success: false, error: "db offline" }),
} as unknown as FixtureDetailsSetupUseCases;

const FAILING_LINEUPS = {
  list: async () => ({ success: false, error: "db offline" }),
} as unknown as FixtureLineupUseCases;

describe("check_fixture_can_start lookup failures", () => {
  let error_spy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fails with a friendly message when officials cannot be loaded", async () => {
    const result = await check_fixture_can_start(
      create_test_fixture(),
      FAILING_OFFICIALS,
      create_mock_lineup_use_cases([]),
    );
    expect(result).toEqual({
      success: false,
      error: FIXTURE_START_CHECKS_MESSAGES.OFFICIALS_LOOKUP_FAILED,
    });
    expect(error_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: FIXTURE_START_CHECKS_EVENT.OFFICIALS_LOOKUP_FAILED,
        technical_detail: "db offline",
      }),
    );
  });

  it("fails with a friendly message when lineups cannot be loaded", async () => {
    const result = await check_fixture_can_start(
      create_test_fixture(),
      create_mock_official_use_cases([]),
      FAILING_LINEUPS,
    );
    expect(result).toEqual({
      success: false,
      error: FIXTURE_START_CHECKS_MESSAGES.LINEUPS_LOOKUP_FAILED,
    });
  });

  it("rejects fixtures without an id", async () => {
    const result = await check_fixture_can_start(
      create_test_fixture({ id: "" }),
      create_mock_official_use_cases([]),
      create_mock_lineup_use_cases([]),
    );
    expect(result).toEqual({
      success: false,
      error: FIXTURE_START_CHECKS_MESSAGES.MISSING_FIXTURE_ID,
    });
  });
});
