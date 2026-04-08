import { describe, expect, it } from "vitest";

import { TOAST_TYPE_CONFIG } from "./toastConfig";

describe("toastConfig", () => {
  it("defines style tokens for each toast tone", () => {
    expect(Object.keys(TOAST_TYPE_CONFIG)).toEqual([
      "success",
      "error",
      "warning",
      "info",
    ]);
    expect(TOAST_TYPE_CONFIG.success.accent).toBe("bg-emerald-500");
    expect(TOAST_TYPE_CONFIG.error.icon_color).toBe("text-secondary-500");
    expect(TOAST_TYPE_CONFIG.warning.icon_bg).toBe(
      "bg-primary-50 dark:bg-primary-900/30",
    );
    expect(TOAST_TYPE_CONFIG.info.accent).toBe("bg-blue-500");
    expect(
      Object.values(TOAST_TYPE_CONFIG).every((config) =>
        config.bg.startsWith("bg-white"),
      ),
    ).toBe(true);
  });
});
