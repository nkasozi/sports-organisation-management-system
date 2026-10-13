export interface SettingsOption {
  value: string;
  label: string;
}

interface SyncIntervalOption {
  value: number;
  label: string;
}

export interface SettingsColorOption extends SettingsOption {
  hex: string;
  class_name: string;
}

export const SYNC_INTERVAL_OPTIONS: ReadonlyArray<SyncIntervalOption> = [
  { value: 600_000, label: "Every 10 minutes" },
  { value: 900_000, label: "Every 15 minutes" },
  { value: 1_800_000, label: "Every 30 minutes" },
  { value: 3_600_000, label: "Every 1 hour (default)" },
];

export const SOCIAL_MEDIA_OPTIONS: ReadonlyArray<SettingsOption> = [
  { value: "twitter", label: "Twitter" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "github", label: "GitHub" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "discord", label: "Discord" },
];

export const COLOR_OPTIONS: ReadonlyArray<SettingsColorOption> = [
  { value: "sky", label: "Sky", hex: "#0284C7", class_name: "bg-sky-600" },
  { value: "blue", label: "Blue", hex: "#2563EB", class_name: "bg-blue-600" },
  {
    value: "green",
    label: "Emerald",
    hex: "#059669",
    class_name: "bg-emerald-600",
  },
  { value: "red", label: "Red", hex: "#DC2626", class_name: "bg-red-600" },
  {
    value: "purple",
    label: "Purple",
    hex: "#9333EA",
    class_name: "bg-purple-600",
  },
  { value: "cyan", label: "Cyan", hex: "#0891B2", class_name: "bg-cyan-600" },
  { value: "pink", label: "Pink", hex: "#DB2777", class_name: "bg-pink-600" },
  { value: "teal", label: "Teal", hex: "#0D9488", class_name: "bg-teal-600" },
  {
    value: "indigo",
    label: "Indigo",
    hex: "#4F46E5",
    class_name: "bg-indigo-600",
  },
  { value: "rose", label: "Rose", hex: "#E11D48", class_name: "bg-rose-600" },
  {
    value: "violet",
    label: "Violet",
    hex: "#7C3AED",
    class_name: "bg-violet-600",
  },
  {
    value: "fuchsia",
    label: "Fuchsia",
    hex: "#C026D3",
    class_name: "bg-fuchsia-600",
  },
  { value: "lime", label: "Lime", hex: "#65A30D", class_name: "bg-lime-600" },
  {
    value: "slate",
    label: "Slate",
    hex: "#475569",
    class_name: "bg-slate-600",
  },
];
