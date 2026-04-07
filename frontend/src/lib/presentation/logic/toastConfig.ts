export type ToastType = "success" | "error" | "warning" | "info";

export const TOAST_TYPE_CONFIG: Record<
  ToastType,
  {
    bg: string;
    border: string;
    accent: string;
    text: string;
    icon_bg: string;
    icon_color: string;
    dismiss_color: string;
  }
> = {
  success: {
    bg: "bg-white dark:bg-accent-800",
    border: "border-accent-200 dark:border-accent-700",
    accent: "bg-emerald-500",
    text: "text-accent-800 dark:text-accent-100",
    icon_bg: "bg-emerald-50 dark:bg-emerald-900/30",
    icon_color: "text-emerald-500",
    dismiss_color:
      "text-accent-400 hover:text-accent-600 dark:hover:text-accent-200",
  },
  error: {
    bg: "bg-white dark:bg-accent-800",
    border: "border-accent-200 dark:border-accent-700",
    accent: "bg-secondary-500",
    text: "text-accent-800 dark:text-accent-100",
    icon_bg: "bg-secondary-50 dark:bg-secondary-900/30",
    icon_color: "text-secondary-500",
    dismiss_color:
      "text-accent-400 hover:text-accent-600 dark:hover:text-accent-200",
  },
  warning: {
    bg: "bg-white dark:bg-accent-800",
    border: "border-accent-200 dark:border-accent-700",
    accent: "bg-primary-500",
    text: "text-accent-800 dark:text-accent-100",
    icon_bg: "bg-primary-50 dark:bg-primary-900/30",
    icon_color: "text-primary-500",
    dismiss_color:
      "text-accent-400 hover:text-accent-600 dark:hover:text-accent-200",
  },
  info: {
    bg: "bg-white dark:bg-accent-800",
    border: "border-accent-200 dark:border-accent-700",
    accent: "bg-blue-500",
    text: "text-accent-800 dark:text-accent-100",
    icon_bg: "bg-blue-50 dark:bg-blue-900/30",
    icon_color: "text-blue-500",
    dismiss_color:
      "text-accent-400 hover:text-accent-600 dark:hover:text-accent-200",
  },
};
