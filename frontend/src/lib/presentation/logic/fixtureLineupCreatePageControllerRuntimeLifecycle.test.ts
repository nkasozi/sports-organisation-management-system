import { afterEach, describe, expect, it, vi } from "vitest";

import { create_fixture_lineup_create_runtime_harness as create_runtime } from "./fixtureLineupCreatePageControllerRuntimeHarness.test_support";

const { initialize_page_mock, submit_form_mock } = vi.hoisted(() => ({
  initialize_page_mock: vi.fn(),
  submit_form_mock: vi.fn(),
}));

vi.mock("./fixtureLineupCreateData", () => ({
  submit_fixture_lineup_create_form: submit_form_mock,
}));

vi.mock("./fixtureLineupCreatePageControllerInitialization", () => ({
  initialize_fixture_lineup_create_page: initialize_page_mock,
}));

describe("fixtureLineupCreatePageControllerRuntime lifecycle", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("handles skip, auth failure and redirect initialization outcomes", async () => {
    const skipped = create_runtime();
    initialize_page_mock.mockResolvedValueOnce({ kind: "skip" });
    await skipped.runtime.initialize_page();
    expect(skipped.state.error_message).toBe("old");

    const failed = create_runtime();
    initialize_page_mock.mockResolvedValueOnce({
      kind: "auth-failed",
      error_message: "denied",
    });
    await failed.runtime.initialize_page();
    expect(failed.state).toMatchObject({
      error_message: "denied",
      loading: false,
    });

    const redirected = create_runtime();
    initialize_page_mock.mockResolvedValueOnce({
      kind: "redirect",
      redirect_to: "/",
    });
    await redirected.runtime.initialize_page();
    expect(redirected.command.goto).toHaveBeenCalledWith("/");
  });

  it("restores default limits when the fixture selection is cleared", async () => {
    const { runtime, state } = create_runtime({ max_players: 30 });
    await runtime.handle_fixture_change("");
    expect(state).toMatchObject({
      min_players: 2,
      max_players: 18,
      starters_count: 11,
      current_step_index: 1,
      error_message: "",
    });
  });

  it("surfaces non-confirmation step 4 failures as page errors and confirmation failures as field errors", async () => {
    const { runtime, state } = create_runtime();
    submit_form_mock.mockResolvedValueOnce({
      success: false,
      error_message: "Duplicate lineup",
      step_index: 4,
      failure_display: "page_error",
    });
    await runtime.handle_submit_locked_lineup();
    expect(state).toMatchObject({
      error_message: "Duplicate lineup",
      validation_errors: {},
      current_step_index: 4,
      saving: false,
    });

    submit_form_mock.mockResolvedValueOnce({
      success: false,
      error_message: "Lineup lock not acknowledged.",
      step_index: 4,
      failure_display: "field_validation",
    });
    await runtime.handle_submit_locked_lineup();
    expect(state.validation_errors).toEqual({
      confirm: "Lineup lock not acknowledged.",
    });
  });
});
