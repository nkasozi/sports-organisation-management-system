import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { HeaderFooterStyle } from "$lib/presentation/stores/branding";

const { branding_store_update } = vi.hoisted(() => ({
  branding_store_update: vi.fn(),
}));

vi.mock("$lib/presentation/stores/branding", () => ({
  branding_store: {
    update: branding_store_update,
  },
}));

import {
  reset_custom_pattern,
  save_footer_pattern,
  save_header_pattern,
  save_panel_borders_enabled,
  upload_custom_pattern,
} from "./settingsThemePatternSettingsLogic";

type BrandingConfigLike = {
  background_pattern_url: string;
  footer_pattern: HeaderFooterStyle;
  header_pattern: HeaderFooterStyle;
  organization_address: string;
  organization_email: string;
  organization_logo_url: string;
  organization_name: string;
  organization_tagline: string;
  show_panel_borders: boolean;
  social_media_links: unknown[];
};

function create_branding_config(
  overrides: Partial<BrandingConfigLike> = {},
): BrandingConfigLike {
  return {
    background_pattern_url: "/default.svg",
    footer_pattern: "solid_color",
    header_pattern: "solid_color",
    organization_address: "",
    organization_email: "",
    organization_logo_url: "",
    organization_name: "Uganda Hockey Association",
    organization_tagline: "",
    show_panel_borders: false,
    social_media_links: [],
    ...overrides,
  };
}

beforeEach(() => {
  branding_store_update.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("settingsThemePatternSettingsLogic", () => {
  it("saves header and footer patterns and reports success", async () => {
    const show_toast = vi.fn();
    let updated_config = create_branding_config();
    branding_store_update.mockImplementation(async (updater) => {
      updated_config = updater(updated_config);
    });

    await save_header_pattern("pattern", show_toast);
    expect(updated_config.header_pattern).toBe("pattern");
    expect(show_toast).toHaveBeenCalledWith("Header set to pattern", "success");

    await save_footer_pattern("solid_color", show_toast);
    expect(updated_config.footer_pattern).toBe("solid_color");
    expect(show_toast).toHaveBeenCalledWith(
      "Footer set to solid color",
      "success",
    );
  });

  it("saves panel border preference and can reset the background pattern", async () => {
    const show_toast = vi.fn();
    const set_background_pattern_url = vi.fn();
    let updated_config = create_branding_config();
    branding_store_update.mockImplementation(async (updater) => {
      updated_config = updater(updated_config);
    });

    await save_panel_borders_enabled(true, show_toast);
    expect(updated_config.show_panel_borders).toBe(true);
    expect(show_toast).toHaveBeenCalledWith("Panel borders enabled", "success");

    await reset_custom_pattern(set_background_pattern_url, show_toast);
    expect(set_background_pattern_url).toHaveBeenCalledWith(
      "/african-mosaic-bg.svg",
    );
    expect(updated_config.background_pattern_url).toBe(
      "/african-mosaic-bg.svg",
    );
    expect(show_toast).toHaveBeenCalledWith(
      "Reset to default pattern",
      "success",
    );
  });

  it("rejects non-svg and oversized uploads before reading the file", () => {
    const show_toast = vi.fn();
    const set_background_pattern_url = vi.fn();

    upload_custom_pattern({
      event: {
        target: {
          files: [{ type: "image/png", size: 1024 }],
        },
      } as unknown as Event,
      set_background_pattern_url,
      show_toast,
    });

    expect(show_toast).toHaveBeenCalledWith(
      "Please upload an SVG file",
      "error",
    );
    expect(set_background_pattern_url).not.toHaveBeenCalled();

    show_toast.mockClear();

    upload_custom_pattern({
      event: {
        target: {
          files: [{ type: "image/svg+xml", size: 501 * 1024 }],
        },
      } as unknown as Event,
      set_background_pattern_url,
      show_toast,
    });

    expect(show_toast).toHaveBeenCalledWith(
      "File size must be less than 500KB",
      "error",
    );
  });

  it("uploads a valid pattern and persists the generated data url", async () => {
    const show_toast = vi.fn();
    const set_background_pattern_url = vi.fn();
    let updated_config = create_branding_config();
    branding_store_update.mockImplementation(async (updater) => {
      updated_config = updater(updated_config);
    });

    class FakeFileReader {
      onerror: (() => void) | null = null;
      onload: ((event: ProgressEvent<FileReader>) => void) | null = null;

      readAsDataURL(): void {
        if (!this.onload) {
          return;
        }
        this.onload({
          target: { result: "data:image/svg+xml;base64,abc123" },
        } as ProgressEvent<FileReader>);
      }
    }

    vi.stubGlobal("FileReader", FakeFileReader);

    upload_custom_pattern({
      event: {
        target: {
          files: [{ type: "image/svg+xml", size: 1024 }],
        },
      } as unknown as Event,
      set_background_pattern_url,
      show_toast,
    });

    await Promise.resolve();
    await Promise.resolve();

    expect(set_background_pattern_url).toHaveBeenCalledWith(
      "data:image/svg+xml;base64,abc123",
    );
    expect(updated_config.background_pattern_url).toBe(
      "data:image/svg+xml;base64,abc123",
    );
    expect(show_toast).toHaveBeenCalledWith(
      "Custom pattern uploaded",
      "success",
    );
  });
});
