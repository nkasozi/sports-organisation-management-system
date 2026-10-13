import type { ToastType } from "$lib/presentation/logic/toastConfig";

export const TOAST_TYPE = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
} as const satisfies Record<string, ToastType>;

export const TOAST_DEFAULT_DISMISS_DELAY_MS = 5000;
export const TOAST_DISMISS_LABEL = "Dismiss";
