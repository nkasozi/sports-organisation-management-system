import type { ErrorConfig } from "$lib/presentation/logic/errorPageState";

export const ERROR_PAGE_ICON = {
  SEARCH: "search",
  LOCK: "lock",
  SHIELD: "shield",
  ALERT: "alert",
} as const;

type ErrorPageIcon = (typeof ERROR_PAGE_ICON)[keyof typeof ERROR_PAGE_ICON];

export const ERROR_PAGE_PRIMARY_ACTION_ICON = {
  RETRY: "retry",
  HOME: "home",
  SIGN_IN: "sign_in",
  NONE: "none",
} as const;

type ErrorPagePrimaryActionIcon =
  (typeof ERROR_PAGE_PRIMARY_ACTION_ICON)[keyof typeof ERROR_PAGE_PRIMARY_ACTION_ICON];

export const ERROR_PAGE_SECONDARY_ACTION = {
  GO_BACK: "go_back",
  GO_HOME: "go_home",
  CONTACT_SUPPORT: "contact_support",
} as const;

type ErrorPageSecondaryAction =
  (typeof ERROR_PAGE_SECONDARY_ACTION)[keyof typeof ERROR_PAGE_SECONDARY_ACTION];

export const ERROR_PAGE_PATHS = {
  HOME: "/",
  CONTACT: "/contact",
} as const;

const ERROR_PAGE_ACTION_LABEL = {
  TRY_AGAIN: "Try Again",
  GO_HOME: "Go Home",
  SIGN_IN: "Sign In",
  GO_BACK: "Go Back",
} as const;

const ERROR_PAGE_RED_ACCENT = "red";

interface ErrorPagePalette {
  bar: string;
  icon_circle: string;
  icon: string;
  code_badge: string;
  primary_button: string;
}

const RED_PALETTE: ErrorPagePalette = {
  bar: "bg-secondary-500",
  icon_circle: "bg-secondary-50 dark:bg-secondary-900/20",
  icon: "text-secondary-500",
  code_badge:
    "bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400",
  primary_button:
    "bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-500",
};

const PRIMARY_PALETTE: ErrorPagePalette = {
  bar: "bg-primary-500",
  icon_circle: "bg-primary-50 dark:bg-primary-900/20",
  icon: "text-primary-500",
  code_badge:
    "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400",
  primary_button:
    "bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500",
};

interface ErrorPageCardView {
  icon: ErrorPageIcon;
  primary_action_icon: ErrorPagePrimaryActionIcon;
  show_secondary_back_icon: boolean;
  palette: ErrorPagePalette;
}

function resolve_error_page_icon(icon: string): ErrorPageIcon {
  switch (icon) {
    case ERROR_PAGE_ICON.SEARCH:
      return ERROR_PAGE_ICON.SEARCH;
    case ERROR_PAGE_ICON.LOCK:
      return ERROR_PAGE_ICON.LOCK;
    case ERROR_PAGE_ICON.SHIELD:
      return ERROR_PAGE_ICON.SHIELD;
    default:
      return ERROR_PAGE_ICON.ALERT;
  }
}

function resolve_primary_action_icon(
  label: string,
): ErrorPagePrimaryActionIcon {
  switch (label) {
    case ERROR_PAGE_ACTION_LABEL.TRY_AGAIN:
      return ERROR_PAGE_PRIMARY_ACTION_ICON.RETRY;
    case ERROR_PAGE_ACTION_LABEL.GO_HOME:
      return ERROR_PAGE_PRIMARY_ACTION_ICON.HOME;
    case ERROR_PAGE_ACTION_LABEL.SIGN_IN:
      return ERROR_PAGE_PRIMARY_ACTION_ICON.SIGN_IN;
    default:
      return ERROR_PAGE_PRIMARY_ACTION_ICON.NONE;
  }
}

export function resolve_error_page_secondary_action(
  label: string,
): ErrorPageSecondaryAction {
  switch (label) {
    case ERROR_PAGE_ACTION_LABEL.GO_BACK:
      return ERROR_PAGE_SECONDARY_ACTION.GO_BACK;
    case ERROR_PAGE_ACTION_LABEL.GO_HOME:
      return ERROR_PAGE_SECONDARY_ACTION.GO_HOME;
    default:
      return ERROR_PAGE_SECONDARY_ACTION.CONTACT_SUPPORT;
  }
}

export function resolve_error_page_card_view(
  config: ErrorConfig,
): ErrorPageCardView {
  return {
    icon: resolve_error_page_icon(config.icon),
    primary_action_icon: resolve_primary_action_icon(
      config.primary_action_label,
    ),
    show_secondary_back_icon:
      resolve_error_page_secondary_action(config.secondary_action_label) ===
      ERROR_PAGE_SECONDARY_ACTION.GO_BACK,
    palette:
      config.accent_color === ERROR_PAGE_RED_ACCENT
        ? RED_PALETTE
        : PRIMARY_PALETTE,
  };
}
