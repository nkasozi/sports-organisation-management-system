import { get } from "svelte/store";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { first_time_setup_store } from "./firstTimeSetup";

describe("firstTimeSetup", () => {
  beforeEach(() => {
    first_time_setup_store.reset();
  });

  afterEach(() => {
    first_time_setup_store.reset();
  });

  it("tracks setup progress through completion", () => {
    first_time_setup_store.set_first_time(true);
    first_time_setup_store.start_setup();
    first_time_setup_store.update_progress("Creating starter data", 60);

    expect(get(first_time_setup_store)).toEqual({
      is_first_time: true,
      is_setting_up: true,
      status_message: "Creating starter data",
      progress_percentage: 60,
      setup_complete: false,
    });

    first_time_setup_store.complete_setup();

    expect(get(first_time_setup_store)).toEqual({
      is_first_time: true,
      is_setting_up: false,
      status_message: "Setup complete!",
      progress_percentage: 100,
      setup_complete: true,
    });
  });

  it("blocks updates until the store is reset", () => {
    first_time_setup_store.block_updates();
    first_time_setup_store.set_first_time(true);
    first_time_setup_store.start_setup();

    expect(get(first_time_setup_store)).toEqual({
      is_first_time: false,
      is_setting_up: false,
      status_message: "Loading...",
      progress_percentage: 0,
      setup_complete: false,
    });

    first_time_setup_store.reset();
    first_time_setup_store.set_first_time(true);

    expect(get(first_time_setup_store).is_first_time).toBe(true);
  });
});
