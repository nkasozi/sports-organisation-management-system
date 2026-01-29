import { writable, derived } from "svelte/store";
import { browser } from "$app/environment";

export type ThemeColorName =
  | "amber"
  | "blue"
  | "green"
  | "red"
  | "purple"
  | "orange"
  | "teal"
  | "pink"
  | "indigo"
  | "emerald"
  | "rose"
  | "violet"
  | "fuchsia"
  | "lime"
  | "sky"
  | "slate"
  | "cyan";

export interface ThemeConfig {
  mode: "light" | "dark";
  primary_color: ThemeColorName;
  secondary_color: ThemeColorName;
}

export interface ColorPalette {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

const COLOR_PALETTES: Record<ThemeColorName, ColorPalette> = {
  amber: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
    950: "#451a03",
  },
  blue: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554",
  },
  green: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
    950: "#052e16",
  },
  red: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
    950: "#450a0a",
  },
  purple: {
    50: "#faf5ff",
    100: "#f3e8ff",
    200: "#e9d5ff",
    300: "#d8b4fe",
    400: "#c084fc",
    500: "#a855f7",
    600: "#9333ea",
    700: "#7c3aed",
    800: "#6b21a8",
    900: "#581c87",
    950: "#3b0764",
  },
  orange: {
    50: "#fff7ed",
    100: "#ffedd5",
    200: "#fed7aa",
    300: "#fdba74",
    400: "#fb923c",
    500: "#f97316",
    600: "#ea580c",
    700: "#c2410c",
    800: "#9a3412",
    900: "#7c2d12",
    950: "#431407",
  },
  teal: {
    50: "#f0fdfa",
    100: "#ccfbf1",
    200: "#99f6e4",
    300: "#5eead4",
    400: "#2dd4bf",
    500: "#14b8a6",
    600: "#0d9488",
    700: "#0f766e",
    800: "#115e59",
    900: "#134e4a",
    950: "#042f2e",
  },
  pink: {
    50: "#fdf2f8",
    100: "#fce7f3",
    200: "#fbcfe8",
    300: "#f9a8d4",
    400: "#f472b6",
    500: "#ec4899",
    600: "#db2777",
    700: "#be185d",
    800: "#9d174d",
    900: "#831843",
    950: "#500724",
  },
  indigo: {
    50: "#eef2ff",
    100: "#e0e7ff",
    200: "#c7d2fe",
    300: "#a5b4fc",
    400: "#818cf8",
    500: "#6366f1",
    600: "#4f46e5",
    700: "#4338ca",
    800: "#3730a3",
    900: "#312e81",
    950: "#1e1b4e",
  },
  emerald: {
    50: "#ecfdf5",
    100: "#d1fae5",
    200: "#a7f3d0",
    300: "#6ee7b7",
    400: "#34d399",
    500: "#10b981",
    600: "#059669",
    700: "#047857",
    800: "#065f46",
    900: "#064e3b",
    950: "#022c22",
  },
  rose: {
    50: "#fff1f2",
    100: "#ffe4e6",
    200: "#fecdd3",
    300: "#fda4af",
    400: "#fb7185",
    500: "#f43f5e",
    600: "#e11d48",
    700: "#be123c",
    800: "#9f1239",
    900: "#881337",
    950: "#4c0519",
  },
  violet: {
    50: "#f5f3ff",
    100: "#ede9fe",
    200: "#ddd6fe",
    300: "#c4b5fd",
    400: "#a78bfa",
    500: "#8b5cf6",
    600: "#7c3aed",
    700: "#6d28d9",
    800: "#5b21b6",
    900: "#4c1d95",
    950: "#2e1065",
  },
  fuchsia: {
    50: "#fdf4ff",
    100: "#fae8ff",
    200: "#f5d0fe",
    300: "#f0abfc",
    400: "#e879f9",
    500: "#d946ef",
    600: "#c026d3",
    700: "#a21caf",
    800: "#86198f",
    900: "#701a75",
    950: "#4a044e",
  },
  lime: {
    50: "#f7fee7",
    100: "#ecfccb",
    200: "#d9f99d",
    300: "#bef264",
    400: "#a3e635",
    500: "#84cc16",
    600: "#65a30d",
    700: "#4d7c0f",
    800: "#3f6212",
    900: "#365314",
    950: "#1a2e05",
  },
  sky: {
    50: "#f0f9ff",
    100: "#e0f2fe",
    200: "#bae6fd",
    300: "#7dd3fc",
    400: "#38bdf8",
    500: "#0ea5e9",
    600: "#0284c7",
    700: "#0369a1",
    800: "#075985",
    900: "#0c4a6e",
    950: "#082f49",
  },
  slate: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
    950: "#020617",
  },
  cyan: {
    50: "#ecfeff",
    100: "#cffafe",
    200: "#a5f3fc",
    300: "#67e8f9",
    400: "#22d3ee",
    500: "#06b6d4",
    600: "#0891b2",
    700: "#0e7490",
    800: "#155e75",
    900: "#164e63",
    950: "#083344",
  },
};

const DEFAULT_THEME: ThemeConfig = {
  mode: "dark",
  primary_color: "red",
  secondary_color: "blue",
};

function get_initial_theme(): ThemeConfig {
  if (!browser) return DEFAULT_THEME;

  try {
    const stored_theme = localStorage.getItem("sports-org-theme-v2");
    if (stored_theme) {
      return { ...DEFAULT_THEME, ...JSON.parse(stored_theme) };
    }

    const prefers_dark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    return {
      ...DEFAULT_THEME,
      mode: prefers_dark ? "dark" : "light",
    };
  } catch (error) {
    console.warn("[theme] Failed to load theme from localStorage:", error);
    return DEFAULT_THEME;
  }
}

export const theme_store = writable<ThemeConfig>(get_initial_theme());

export const primary_palette = derived(
  theme_store,
  ($theme) => COLOR_PALETTES[$theme.primary_color],
);

export const secondary_palette = derived(
  theme_store,
  ($theme) => COLOR_PALETTES[$theme.secondary_color],
);

function apply_theme_to_document(theme_config: ThemeConfig): void {
  if (!browser) return;

  const html_element = document.documentElement;
  const primary = COLOR_PALETTES[theme_config.primary_color];
  const secondary = COLOR_PALETTES[theme_config.secondary_color];

  if (theme_config.mode === "dark") {
    html_element.classList.add("dark");
  } else {
    html_element.classList.remove("dark");
  }

  html_element.style.setProperty("--color-primary-50", primary[50]);
  html_element.style.setProperty("--color-primary-100", primary[100]);
  html_element.style.setProperty("--color-primary-200", primary[200]);
  html_element.style.setProperty("--color-primary-300", primary[300]);
  html_element.style.setProperty("--color-primary-400", primary[400]);
  html_element.style.setProperty("--color-primary-500", primary[500]);
  html_element.style.setProperty("--color-primary-600", primary[600]);
  html_element.style.setProperty("--color-primary-700", primary[700]);
  html_element.style.setProperty("--color-primary-800", primary[800]);
  html_element.style.setProperty("--color-primary-900", primary[900]);
  html_element.style.setProperty("--color-primary-950", primary[950]);

  html_element.style.setProperty("--color-secondary-50", secondary[50]);
  html_element.style.setProperty("--color-secondary-100", secondary[100]);
  html_element.style.setProperty("--color-secondary-200", secondary[200]);
  html_element.style.setProperty("--color-secondary-300", secondary[300]);
  html_element.style.setProperty("--color-secondary-400", secondary[400]);
  html_element.style.setProperty("--color-secondary-500", secondary[500]);
  html_element.style.setProperty("--color-secondary-600", secondary[600]);
  html_element.style.setProperty("--color-secondary-700", secondary[700]);
  html_element.style.setProperty("--color-secondary-800", secondary[800]);
  html_element.style.setProperty("--color-secondary-900", secondary[900]);
  html_element.style.setProperty("--color-secondary-950", secondary[950]);
}

function save_theme_to_storage(theme_config: ThemeConfig): void {
  if (!browser) return;

  try {
    localStorage.setItem("sports-org-theme-v2", JSON.stringify(theme_config));
  } catch (error) {
    console.warn("[theme] Failed to save theme to localStorage:", error);
  }
}

if (browser) {
  theme_store.subscribe((theme_config: ThemeConfig) => {
    apply_theme_to_document(theme_config);
    save_theme_to_storage(theme_config);
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

export function set_primary_color(color: ThemeColorName): void {
  theme_store.update((current_theme) => ({
    ...current_theme,
    primary_color: color,
  }));
}

export function set_secondary_color(color: ThemeColorName): void {
  theme_store.update((current_theme) => ({
    ...current_theme,
    secondary_color: color,
  }));
}

export function update_theme_colors(options: {
  primaryColor?: string;
  secondaryColor?: string;
}): void {
  const color_name_map: Record<string, ThemeColorName> = {
    yellow: "amber",
    amber: "amber",
    blue: "blue",
    green: "green",
    red: "red",
    purple: "purple",
    orange: "orange",
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

  theme_store.update((current_theme) => {
    const new_theme = { ...current_theme };

    if (options.primaryColor) {
      const mapped_color =
        color_name_map[options.primaryColor.toLowerCase()] || "amber";
      new_theme.primary_color = mapped_color;
    }

    if (options.secondaryColor) {
      const mapped_color =
        color_name_map[options.secondaryColor.toLowerCase()] || "red";
      new_theme.secondary_color = mapped_color;
    }

    return new_theme;
  });
}

export function reset_theme_to_default(): void {
  theme_store.set(DEFAULT_THEME);
}

export function get_available_colors(): ThemeColorName[] {
  return Object.keys(COLOR_PALETTES) as ThemeColorName[];
}

export function get_color_palette(color: ThemeColorName): ColorPalette {
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
