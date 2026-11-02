import { describe, expect, it } from "vitest";

import { create_mock_storage } from "./columnPreferences.test_support";
import {
  load_results_view_mode,
  RESULTS_VIEW_MODE,
  RESULTS_VIEW_SURFACE,
  save_results_view_mode,
} from "./competitionResultsViewMode";

describe("results view mode preference", () => {
  it("defaults to the list view when nothing has been saved", async () => {
    const result = await load_results_view_mode({
      storage: create_mock_storage(),
      surface: RESULTS_VIEW_SURFACE.STANDINGS,
    });

    expect(result).toEqual({ success: true, data: RESULTS_VIEW_MODE.LIST });
  });

  it("remembers the view separately for each tab", async () => {
    const storage = create_mock_storage();

    const save_result = await save_results_view_mode({
      storage,
      surface: RESULTS_VIEW_SURFACE.RESULTS,
      view_mode: RESULTS_VIEW_MODE.BRACKET,
    });
    const results_view = await load_results_view_mode({
      storage,
      surface: RESULTS_VIEW_SURFACE.RESULTS,
    });
    const standings_view = await load_results_view_mode({
      storage,
      surface: RESULTS_VIEW_SURFACE.STANDINGS,
    });

    expect(save_result.success).toBe(true);
    expect(results_view).toEqual({
      success: true,
      data: RESULTS_VIEW_MODE.BRACKET,
    });
    expect(standings_view).toEqual({
      success: true,
      data: RESULTS_VIEW_MODE.LIST,
    });
  });
});
