export const ERROR_DISPLAY_VARIANT = {
  INLINE: "inline",
  PAGE: "page",
} as const;

export type ErrorDisplayVariant =
  (typeof ERROR_DISPLAY_VARIANT)[keyof typeof ERROR_DISPLAY_VARIANT];

export const ERROR_DISPLAY_SEVERITY = {
  WARNING: "warning",
  ERROR: "error",
} as const;

export type ErrorDisplaySeverity =
  (typeof ERROR_DISPLAY_SEVERITY)[keyof typeof ERROR_DISPLAY_SEVERITY];

export const ERROR_DISPLAY_DEFAULT_TEXT = {
  TITLE: "Something went wrong",
  MESSAGE: "An unexpected error occurred. Please try again.",
  RETRY: "Try Again",
  BACK: "Go Back",
} as const;

interface ErrorDisplayPalette {
  page_bar: string;
  page_icon_circle: string;
  page_icon: string;
  page_retry_button: string;
  inline_container: string;
  inline_bar: string;
  inline_icon_circle: string;
  inline_icon: string;
  inline_retry_button: string;
}

export const ERROR_DISPLAY_SEVERITY_PALETTE: Record<
  ErrorDisplaySeverity,
  ErrorDisplayPalette
> = {
  [ERROR_DISPLAY_SEVERITY.ERROR]: {
    page_bar: "bg-secondary-500",
    page_icon_circle: "bg-secondary-50 dark:bg-secondary-900/20",
    page_icon: "text-secondary-500",
    page_retry_button: "bg-secondary-500 text-white hover:bg-secondary-600",
    inline_container:
      "border-secondary-200 dark:border-secondary-800/50 bg-secondary-50/50 dark:bg-secondary-900/10",
    inline_bar: "bg-secondary-400",
    inline_icon_circle: "bg-secondary-100 dark:bg-secondary-900/30",
    inline_icon: "text-secondary-500",
    inline_retry_button:
      "text-secondary-600 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300",
  },
  [ERROR_DISPLAY_SEVERITY.WARNING]: {
    page_bar: "bg-primary-500",
    page_icon_circle: "bg-primary-50 dark:bg-primary-900/20",
    page_icon: "text-primary-500",
    page_retry_button: "bg-primary-500 text-white hover:bg-primary-600",
    inline_container:
      "border-primary-200 dark:border-primary-800/50 bg-primary-50/50 dark:bg-primary-900/10",
    inline_bar: "bg-primary-400",
    inline_icon_circle: "bg-primary-100 dark:bg-primary-900/30",
    inline_icon: "text-primary-500",
    inline_retry_button:
      "text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300",
  },
};
