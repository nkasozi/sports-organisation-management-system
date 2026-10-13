import { writable } from "svelte/store";

import { browser } from "$app/environment";
import { get_app_settings_storage } from "$lib/infrastructure/container";

import { COLOR_PALETTES } from "./themeColorPalettes";
import {
  COLOR_NAME_MAP,
  DARK_MODE_CLASS_NAME,
  DEFAULT_THEME,
  FALLBACK_PRIMARY_COLOR,
  FALLBACK_SECONDARY_COLOR,
  MEDIA_QUERY_CHANGE_EVENT,
  PREFERS_DARK_COLOR_SCHEME_QUERY,
  THEME_LOG_EVENTS,
  THEME_MODE,
  THEME_PALETTE_PREFIX,
  THEME_STORAGE_KEY,
} from "./themeConstants";
import type { PaletteShade, ThemeColorName, ThemeConfig } from "./themeTypes";
import { PALETTE_SHADES } from "./themeTypes";

export { get_theme_classes } from "./themeClasses";
export type { ThemeConfig } from "./themeTypes";

function to_theme_mode(prefers_dark: boolean): ThemeConfig["mode"] {
  return prefers_dark ? THEME_MODE.DARK : THEME_MODE.LIGHT;
}

function get_system_preference_theme(): ThemeConfig {
  const prefers_dark = window.matchMedia(
    PREFERS_DARK_COLOR_SCHEME_QUERY,
  ).matches;
  return { ...DEFAULT_THEME, mode: to_theme_mode(prefers_dark) };
}

export const theme_store = writable<ThemeConfig>(DEFAULT_THEME);

function apply_stored_theme(stored_theme_json: string): boolean {
  try {
    const parsed = JSON.parse(stored_theme_json) as Partial<ThemeConfig>;
    theme_store.set({ ...DEFAULT_THEME, ...parsed });
    return true;
  } catch (error) {
    console.warn("[theme] Stored theme unreadable; using system preference", {
      event: THEME_LOG_EVENTS.PARSE_FAILED,
      error: String(error),
    });
    return false;
  }
}

export async function initialize_theme(): Promise<void> {
  if (!browser) return;
  const stored_theme_json =
    await get_app_settings_storage().get_setting(THEME_STORAGE_KEY);
  if (stored_theme_json && apply_stored_theme(stored_theme_json)) return;
  theme_store.set(get_system_preference_theme());
}

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
  html_element.classList.toggle(
    DARK_MODE_CLASS_NAME,
    theme_config.mode === THEME_MODE.DARK,
  );
  apply_palette_css_variables(
    html_element,
    THEME_PALETTE_PREFIX.PRIMARY,
    COLOR_PALETTES[theme_config.primary_color],
  );
  apply_palette_css_variables(
    html_element,
    THEME_PALETTE_PREFIX.SECONDARY,
    COLOR_PALETTES[theme_config.secondary_color],
  );
}

async function save_theme_to_storage(theme_config: ThemeConfig): Promise<void> {
  if (!browser) return;
  await get_app_settings_storage().set_setting(
    THEME_STORAGE_KEY,
    JSON.stringify(theme_config),
  );
  console.debug("[theme] Saved theme", {
    event: THEME_LOG_EVENTS.SAVED,
    mode: theme_config.mode,
  });
}

if (browser) {
  theme_store.subscribe((theme_config: ThemeConfig) => {
    apply_theme_to_document(theme_config);
    save_theme_to_storage(theme_config).catch((error: unknown) => {
      console.warn("[theme] Failed to persist theme", {
        event: THEME_LOG_EVENTS.SAVE_FAILED,
        error: String(error),
      });
    });
  });

  window
    .matchMedia(PREFERS_DARK_COLOR_SCHEME_QUERY)
    .addEventListener(MEDIA_QUERY_CHANGE_EVENT, (event) => {
      theme_store.update((current_theme) => ({
        ...current_theme,
        mode: to_theme_mode(event.matches),
      }));
    });
}

export function toggle_theme_mode(): void {
  theme_store.update((current_theme) => ({
    ...current_theme,
    mode: to_theme_mode(current_theme.mode === THEME_MODE.LIGHT),
  }));
}

function resolve_theme_color(
  color_name: string,
  fallback_color: ThemeColorName,
): ThemeColorName {
  return COLOR_NAME_MAP[color_name.toLowerCase()] || fallback_color;
}

export function update_theme_colors(options: {
  primaryColor?: string;
  secondaryColor?: string;
}): void {
  theme_store.update((current_theme) => ({
    ...current_theme,
    ...(options.primaryColor
      ? {
          primary_color: resolve_theme_color(
            options.primaryColor,
            FALLBACK_PRIMARY_COLOR,
          ),
        }
      : {}),
    ...(options.secondaryColor
      ? {
          secondary_color: resolve_theme_color(
            options.secondaryColor,
            FALLBACK_SECONDARY_COLOR,
          ),
        }
      : {}),
  }));
}

export function reset_theme_to_default(): void {
  theme_store.set(DEFAULT_THEME);
}
