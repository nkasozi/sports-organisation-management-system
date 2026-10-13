import { THEME_MODE } from "./themeConstants";
import type { ThemeConfig } from "./themeTypes";

const BOOLEAN_FLAG_TEXT = { TRUE: "true", FALSE: "false" } as const;

function to_flag_text(is_enabled: boolean): string {
  return is_enabled ? BOOLEAN_FLAG_TEXT.TRUE : BOOLEAN_FLAG_TEXT.FALSE;
}

export function get_theme_classes(
  theme_config: ThemeConfig,
): Record<string, string> {
  return {
    isDark: to_flag_text(theme_config.mode === THEME_MODE.DARK),
    isLight: to_flag_text(theme_config.mode === THEME_MODE.LIGHT),
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
