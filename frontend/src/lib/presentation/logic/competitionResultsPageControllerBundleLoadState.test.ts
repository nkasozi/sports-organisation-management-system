import { describe, expect, it, vi } from "vitest";

import { apply_competition_results_bundle_with_load_state } from "./competitionResultsPageControllerHandlers";
import { create_empty_competition_results_bundle } from "./competitionResultsPageState";

vi.mock("./competitionResultsPageControllerDependencies", () => ({
  competition_results_page_dependencies: {},
}));

vi.mock("$lib/infrastructure/sync/convexPublicDataService", () => ({
  fetch_public_data_from_convex: vi.fn(),
}));

function create_command(): never {
  return {
    apply_bundle: vi.fn(),
    set_error_message: vi.fn(),
    set_loading_state: vi.fn(),
  } as never;
}

describe("apply_competition_results_bundle_with_load_state", () => {
  it("shows the friendly error when part of the competition failed to load", () => {
    const command = create_command() as unknown as Record<
      string,
      ReturnType<typeof vi.fn>
    >;
    const bundle = {
      ...create_empty_competition_results_bundle(),
      load_state: { status: "failed", error_message: "Please refresh." },
    } as never;
    expect(
      apply_competition_results_bundle_with_load_state(
        command as never,
        bundle,
      ),
    ).toBe(false);
    expect(command.apply_bundle).toHaveBeenCalledWith(bundle);
    expect(command.set_error_message).toHaveBeenCalledWith("Please refresh.");
    expect(command.set_loading_state).toHaveBeenCalledWith("error");
  });

  it("leaves the page state alone when everything loaded", () => {
    const command = create_command() as unknown as Record<
      string,
      ReturnType<typeof vi.fn>
    >;
    expect(
      apply_competition_results_bundle_with_load_state(
        command as never,
        create_empty_competition_results_bundle(),
      ),
    ).toBe(true);
    expect(command.set_loading_state).not.toHaveBeenCalled();
  });
});
