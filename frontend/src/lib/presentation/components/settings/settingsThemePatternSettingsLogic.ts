import {
  branding_store,
  type HeaderFooterStyle,
} from "$lib/presentation/stores/branding";

type ToastType = "success" | "error" | "info";

const DEFAULT_PATTERN_URL = "/african-mosaic-bg.svg";
const MAX_PATTERN_FILE_SIZE_BYTES = 500 * 1024;
const SVG_MIME_FRAGMENT = "svg";

type ShowToast = (message: string, type: ToastType) => void;

export async function save_header_pattern(
  pattern: HeaderFooterStyle,
  show_toast: ShowToast,
): Promise<void> {
  await branding_store.update((config) => ({
    ...config,
    header_pattern: pattern,
  }));
  show_toast(
    pattern === "pattern"
      ? "Header set to pattern"
      : "Header set to solid color",
    "success",
  );
}

export async function save_footer_pattern(
  pattern: HeaderFooterStyle,
  show_toast: ShowToast,
): Promise<void> {
  await branding_store.update((config) => ({
    ...config,
    footer_pattern: pattern,
  }));
  show_toast(
    pattern === "pattern"
      ? "Footer set to pattern"
      : "Footer set to solid color",
    "success",
  );
}

export async function save_panel_borders_enabled(
  enabled: boolean,
  show_toast: ShowToast,
): Promise<void> {
  await branding_store.update((config) => ({
    ...config,
    show_panel_borders: enabled,
  }));
  show_toast(
    enabled ? "Panel borders enabled" : "Panel borders disabled",
    "success",
  );
}

export function upload_custom_pattern(command: {
  event: Event;
  set_background_pattern_url: (value: string) => void;
  show_toast: ShowToast;
}): void {
  const input = command.event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) {
    return;
  }
  if (!file.type.includes(SVG_MIME_FRAGMENT)) {
    command.show_toast("Please upload an SVG file", "error");
    return;
  }
  if (file.size > MAX_PATTERN_FILE_SIZE_BYTES) {
    command.show_toast("File size must be less than 500KB", "error");
    return;
  }
  const reader = new FileReader();
  reader.onload = (load_event: ProgressEvent<FileReader>) => {
    const result = load_event.target?.result as string;
    command.set_background_pattern_url(result);
    void branding_store
      .update((config) => ({
        ...config,
        background_pattern_url: result,
      }))
      .then(() => command.show_toast("Custom pattern uploaded", "success"))
      .catch((error: unknown) => {
        console.warn("[SettingsThemePatternSettings] Failed to save pattern", {
          event: "settings_pattern_save_failed",
          error: String(error),
        });
        command.show_toast("Failed to save custom pattern", "error");
      });
  };
  reader.onerror = () => command.show_toast("Failed to read file", "error");
  reader.readAsDataURL(file);
}

export async function reset_custom_pattern(
  set_background_pattern_url: (value: string) => void,
  show_toast: ShowToast,
): Promise<void> {
  set_background_pattern_url(DEFAULT_PATTERN_URL);
  await branding_store.update((config) => ({
    ...config,
    background_pattern_url: DEFAULT_PATTERN_URL,
  }));
  show_toast("Reset to default pattern", "success");
}
