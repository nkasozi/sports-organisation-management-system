import { describe, expect, it, vi } from "vitest";

import type { AppSettingsPort } from "$lib/core/interfaces/ports";

import { create_mock_storage } from "./columnPreferences.test_support";
import {
  load_stage_order_preference,
  ORDER_PREFERENCE,
  order_stage_results_sections,
  save_stage_order_preference,
  STAGE_ORDER,
  toggle_stage_order,
} from "./competitionStageOrder";
import type { CompetitionStageResultsSection } from "./competitionStageResults";

const STAGE_ORDER_SETTING_KEY = "competition_results_stage_order";

function build_section(stage_name: string): CompetitionStageResultsSection {
  return {
    stage: { name: stage_name },
    fixtures: [],
    standings: [],
    inferred_groups: [],
  } as unknown as CompetitionStageResultsSection;
}

const round_of_16 = build_section("Round of 16");
const quarter_finals = build_section("Quarter Finals");
const finals = build_section("Finals");
const sections_in_stage_order = [round_of_16, quarter_finals, finals];

describe("toggle_stage_order", () => {
  it("flips ascending to descending and back", () => {
    expect(toggle_stage_order(STAGE_ORDER.ASCENDING)).toBe(
      STAGE_ORDER.DESCENDING,
    );
    expect(toggle_stage_order(STAGE_ORDER.DESCENDING)).toBe(
      STAGE_ORDER.ASCENDING,
    );
  });
});

describe("order_stage_results_sections", () => {
  it("keeps the stage order when ascending", () => {
    expect(
      order_stage_results_sections(
        sections_in_stage_order,
        STAGE_ORDER.ASCENDING,
      ),
    ).toEqual([round_of_16, quarter_finals, finals]);
  });

  it("puts the latest stage first when descending without mutating the input", () => {
    expect(
      order_stage_results_sections(
        sections_in_stage_order,
        STAGE_ORDER.DESCENDING,
      ),
    ).toEqual([finals, quarter_finals, round_of_16]);
    expect(sections_in_stage_order).toEqual([
      round_of_16,
      quarter_finals,
      finals,
    ]);
  });
});

describe("stage order preference", () => {
  it("defaults to ascending when nothing has been saved", async () => {
    const result = await load_stage_order_preference({
      storage: create_mock_storage(),
      preference: ORDER_PREFERENCE.STANDINGS_STAGES,
    });

    expect(result).toEqual({ success: true, data: STAGE_ORDER.ASCENDING });
  });

  it("remembers the saved order", async () => {
    const storage = create_mock_storage();

    const save_result = await save_stage_order_preference({
      storage,
      preference: ORDER_PREFERENCE.STANDINGS_STAGES,
      stage_order: STAGE_ORDER.DESCENDING,
    });
    const result = await load_stage_order_preference({
      storage,
      preference: ORDER_PREFERENCE.STANDINGS_STAGES,
    });

    expect(save_result.success).toBe(true);

    expect(storage.set_setting).toHaveBeenCalledWith(
      STAGE_ORDER_SETTING_KEY,
      STAGE_ORDER.DESCENDING,
    );
    expect(result).toEqual({ success: true, data: STAGE_ORDER.DESCENDING });
  });

  it("treats an unrecognised saved value as ascending", async () => {
    const storage = create_mock_storage();
    await storage.set_setting(STAGE_ORDER_SETTING_KEY, "sideways");

    const result = await load_stage_order_preference({
      storage,
      preference: ORDER_PREFERENCE.STANDINGS_STAGES,
    });

    expect(result).toEqual({ success: true, data: STAGE_ORDER.ASCENDING });
  });

  it("returns a failure when storage cannot be read", async () => {
    const storage: AppSettingsPort = {
      ...create_mock_storage(),
      get_setting: vi.fn(() => Promise.reject(new Error("storage offline"))),
    };

    const result = await load_stage_order_preference({
      storage,
      preference: ORDER_PREFERENCE.STANDINGS_STAGES,
    });

    expect(result.success).toBe(false);
  });

  it("returns a failure when storage cannot be written", async () => {
    const storage: AppSettingsPort = {
      ...create_mock_storage(),
      set_setting: vi.fn(() => Promise.reject(new Error("storage offline"))),
    };

    const result = await save_stage_order_preference({
      storage,
      preference: ORDER_PREFERENCE.STANDINGS_STAGES,
      stage_order: STAGE_ORDER.DESCENDING,
    });

    expect(result.success).toBe(false);
  });
});

describe("results order preference", () => {
  it("defaults to latest first and is remembered apart from stage order", async () => {
    const storage = create_mock_storage();
    const initial = await load_stage_order_preference({
      storage,
      preference: ORDER_PREFERENCE.RESULTS_KICKOFF,
    });

    const save_result = await save_stage_order_preference({
      storage,
      preference: ORDER_PREFERENCE.RESULTS_KICKOFF,
      stage_order: STAGE_ORDER.ASCENDING,
    });
    const results_order = await load_stage_order_preference({
      storage,
      preference: ORDER_PREFERENCE.RESULTS_KICKOFF,
    });
    const stage_order = await load_stage_order_preference({
      storage,
      preference: ORDER_PREFERENCE.STANDINGS_STAGES,
    });

    expect(initial).toEqual({ success: true, data: STAGE_ORDER.DESCENDING });
    expect(save_result.success).toBe(true);
    expect(results_order).toEqual({
      success: true,
      data: STAGE_ORDER.ASCENDING,
    });
    expect(stage_order).toEqual({ success: true, data: STAGE_ORDER.ASCENDING });
  });
});
