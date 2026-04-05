import { writable, derived } from "svelte/store";
import { browser } from "$app/environment";
import { get_app_settings_storage } from "$lib/infrastructure/container";
export type {
  ThemeColorName,
  ThemeConfig,
  ColorPalette,
  PaletteShade,
} from "./themeTypes";
import type { ThemeColorName, ThemeConfig, PaletteShade } from "./themeTypes";
import { PALETTE_SHADES } from "./themeTypes";
export { COLOR_PALETTES } from "./themeColorPalettes";
import { COLOR_PALETTES } from "./themeColorPalettes";

const DEFAULT_THEME: ThemeConfig = {
  mode: "dark",
  primary_color: "red",
  secondary_color: "blue",
};

function get_system_preference_theme(): ThemeConfig {
  const prefers_dark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;
  return { ...DEFAULT_THEME, mode: prefers_dark ? "dark" : "light" };
}

export const theme_store = writable<ThemeConfig>(DEFAULT_THEME);

export async function initialize_theme(): Promise<void> {
  if (!browser) return;

  const stored_theme_json = await get_app_settings_storage().get_setting(
    "sports-org-theme-v2",
  );

  if (stored_theme_json) {
    try {
      const parsed = JSON.parse(stored_theme_json) as Partial<ThemeConfig>;
      theme_store.set({ ...DEFAULT_THEME, ...parsed });
      return;
    } catch {
      console.warn(
        "[theme] Failed to parse stored theme, falling back to system preference",
        { event: "theme_parse_failed" },
      );
    }
  }

  theme_store.set(get_system_preference_theme());
}

const primary_palette = derived(
  theme_store,
  ($theme) => COLOR_PALETTES[$theme.primary_color],
);
const secondary_palette = derived(
  theme_store,
  ($theme) => COLOR_PALETTES[$theme.secondary_color],
);

function apply_palette_css_variables(
  html_element: HTMLElement,
  prefix: string,
  palette: Record<PaletteShade, string>,
): void {
  for (const shade of PALETTE_SHADES) {
    html_element.style.setProperty(
      `--color-${prefix}-${shade}`,
      palette[shade],
    );
  }
}

function apply_theme_to_document(theme_config: ThemeConfig): void {
  if (!browser) return;
  const html_element = document.documentElement;

  if (theme_config.mode === "dark") {
    html_element.classList.add("dark");
  } else {
    html_element.classList.remove("dark");
  }

  apply_palette_css_variables(
    html_element,
    "primary",
    COLOR_PALETTES[theme_config.primary_color],
  );
  apply_palette_css_variables(
    html_element,
    "secondary",
    COLOR_PALETTES[theme_config.secondary_color],
  );
}

async function save_theme_to_storage(theme_config: ThemeConfig): Promise<void> {
  if (!browser) return;
  await get_app_settings_storage().set_setting(
    "sports-org-theme-v2",
    JSON.stringify(theme_config),
  );
  console.debug("[theme] Saved theme", {
    event: "theme_saved",
    mode: theme_config.mode,
  });
}

if (browser) {
  theme_store.subscribe((theme_config: ThemeConfig) => {
    apply_theme_to_document(theme_config);
    save_theme_to_storage(theme_config).catch((error) => {
      console.warn("[theme] Failed to persist theme", {
        event: "theme_save_failed",
        error,
      });
    });
  });

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (event) => {
      theme_store.update((current_theme) => ({
        ...current_theme,
        mode: event.matches ? "dark" : "light",
      }));
    });
}

export function toggle_theme_mode(): void {
  theme_store.update((current_theme) => ({
    ...current_theme,
    mode: current_theme.mode === "light" ? "dark" : "light",
  }));
}

function set_primary_color(color: ThemeColorName): void {
  theme_store.update((current_theme) => ({
    ...current_theme,
    primary_color: color,
  }));
}

function set_secondary_color(color: ThemeColorName): void {
  theme_store.update((current_theme) => ({
    ...current_theme,
    secondary_color: color,
  }));
}

const COLOR_NAME_MAP: Record<string, ThemeColorName> = {
  yellow: "sky",
  amber: "sky",
  blue: "blue",
  green: "green",
  red: "red",
  purple: "purple",
  orange: "cyan",
  teal: "teal",
  pink: "pink",
  indigo: "indigo",
  emerald: "emerald",
  cyan: "cyan",
  rose: "rose",
  violet: "violet",
  fuchsia: "fuchsia",
  lime: "lime",
  sky: "sky",
  slate: "slate",
};

export function update_theme_colors(options: {
  primaryColor?: string;
  secondaryColor?: string;
}): void {
  theme_store.update((current_theme) => {
    const new_theme = { ...current_theme };
    if (options.primaryColor)
      new_theme.primary_color =
        COLOR_NAME_MAP[options.primaryColor.toLowerCase()] || "blue";
    if (options.secondaryColor)
      new_theme.secondary_color =
        COLOR_NAME_MAP[options.secondaryColor.toLowerCase()] || "red";
    return new_theme;
  });
}

export function reset_theme_to_default(): void {
  theme_store.set(DEFAULT_THEME);
}

function get_available_colors(): ThemeColorName[] {
  return Object.keys(COLOR_PALETTES) as ThemeColorName[];
}

function get_color_palette(color: ThemeColorName) {
  return COLOR_PALETTES[color];
}

export function get_theme_classes(
  theme_config: ThemeConfig,
): Record<string, string> {
  return {
    isDark: theme_config.mode === "dark" ? "true" : "false",
    isLight: theme_config.mode === "light" ? "true" : "false",
    primaryBg: "bg-theme-primary-500",
    primaryText: "text-theme-primary-500",
    secondaryBg: "bg-theme-secondary-500",
    secondaryText: "text-theme-secondary-500",
    cardBg: "bg-white dark:bg-gray-800",
    textPrimary: "text-gray-900 dark:text-gray-100",
    textSecondary: "text-gray-700 dark:text-gray-300",
    border: "border-gray-200 dark:border-gray-700",
  };
}
