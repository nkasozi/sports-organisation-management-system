import { describe, expect, it, vi } from "vitest";

import {
  show_live_game_detail_toast,
  update_live_game_detail_state,
} from "./liveGameDetailControllerUtils";

describe("liveGameDetailControllerUtils", () => {
  it("updates state through the supplied getter, updater, and setter", () => {
    const set_state = vi.fn();
    const result = update_live_game_detail_state({
      get_state: () => ({ count: 2 }),
      set_state,
      updater: (state) => ({ count: state.count + 3 }),
    });

    expect(result).toEqual({ count: 5 });
    expect(set_state).toHaveBeenCalledWith({ count: 5 });
  });

  it("shows toast state with the provided message and type", () => {
    const set_toast_state = vi.fn();

    show_live_game_detail_toast(
      set_toast_state,
      "Saved successfully",
      "success",
    );

    expect(set_toast_state).toHaveBeenCalledWith({
      is_visible: true,
      message: "Saved successfully",
      type: "success",
    });
  });
});
