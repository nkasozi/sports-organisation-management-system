import { describe, expect, it, type Mock, vi } from "vitest";

import {
  apply_settings_page_load_state,
  mark_settings_page_failed,
  mark_settings_page_ready,
  SETTINGS_PAGE_LOAD_STATUS,
} from "./settingsPageLoadState";

function create_sink(): {
  set_is_loading: Mock<(value: boolean) => void>;
  set_error_message: Mock<(value: string) => void>;
} {
  return {
    set_is_loading: vi.fn<(value: boolean) => void>(),
    set_error_message: vi.fn<(value: string) => void>(),
  };
}

describe("settingsPageLoadState", () => {
  it("marks the page ready and stops loading without an error", () => {
    const sink = create_sink();
    expect(
      apply_settings_page_load_state(sink, mark_settings_page_ready()),
    ).toEqual({
      status: SETTINGS_PAGE_LOAD_STATUS.READY,
    });
    expect(sink.set_is_loading).toHaveBeenCalledWith(false);
    expect(sink.set_error_message).not.toHaveBeenCalled();
  });

  it("marks the page failed with its message and stops loading", () => {
    const sink = create_sink();
    apply_settings_page_load_state(sink, mark_settings_page_failed("Denied"));
    expect(sink.set_error_message).toHaveBeenCalledWith("Denied");
    expect(sink.set_is_loading).toHaveBeenCalledWith(false);
  });

  it("keeps the page loading while in the loading state", () => {
    const sink = create_sink();
    apply_settings_page_load_state(sink, {
      status: SETTINGS_PAGE_LOAD_STATUS.LOADING,
    });
    expect(sink.set_is_loading).toHaveBeenCalledWith(true);
  });
});
