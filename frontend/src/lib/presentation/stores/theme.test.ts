import { get } from "svelte/store";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  get_theme_classes,
  initialize_theme,
  reset_theme_to_default,
  theme_store,
  toggle_theme_mode,
  update_theme_colors,
} from "./theme";

const theme_mocks = vi.hoisted(() => ({
  get_setting: vi.fn(),
  set_setting: vi.fn(),
}));

vi.mock("$app/environment", () => ({
  browser: false,
}));

vi.mock("$lib/infrastructure/container", () => ({
  get_app_settings_storage: () => ({
    get_setting: theme_mocks.get_setting,
    set_setting: theme_mocks.set_setting,
  }),
}));

afterEach((): void => {
  theme_mocks.get_setting.mockReset();
  theme_mocks.set_setting.mockReset();
  reset_theme_to_default();
});

describe("theme store", () => {
  it("toggles the current mode and can reset back to the default theme", () => {
    reset_theme_to_default();

    toggle_theme_mode();
    expect(get(theme_store)).toMatchObject({
      mode: "light",
      primary_color: "red",
      secondary_color: "blue",
    });

    reset_theme_to_default();
    expect(get(theme_store)).toMatchObject({
      mode: "dark",
      primary_color: "red",
      secondary_color: "blue",
    });
  });

  it("normalizes human color names and falls back for unknown inputs", () => {
    reset_theme_to_default();

    update_theme_colors({ primaryColor: "amber", secondaryColor: "unknown" });
    expect(get(theme_store)).toMatchObject({
      primary_color: "sky",
      secondary_color: "red",
    });

    update_theme_colors({ primaryColor: "teal", secondaryColor: "green" });
    expect(get(theme_store)).toMatchObject({
      primary_color: "teal",
      secondary_color: "green",
    });
  });

  it("returns stable UI class flags for dark and light themes", () => {
    expect(
      get_theme_classes({
        mode: "dark",
        primary_color: "red",
        secondary_color: "blue",
      }),
    ).toMatchObject({
      isDark: "true",
      isLight: "false",
      primaryBg: "bg-theme-primary-500",
      secondaryText: "text-theme-secondary-500",
    });
  });

  it("does not touch storage during initialization outside the browser", async () => {
    await initialize_theme();

    expect(theme_mocks.get_setting).not.toHaveBeenCalled();
    expect(theme_mocks.set_setting).not.toHaveBeenCalled();
  });
});
