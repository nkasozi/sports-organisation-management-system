import { describe, expect, it } from "vitest";

import {
  build_syncable_image_file_size_error,
  format_syncable_file_size,
  MAX_SYNCABLE_IMAGE_FILE_BYTES,
  validate_syncable_image_file,
} from "./syncableImageFileValidation";

describe("syncableImageFileValidation", () => {
  it("formats syncable image size limits for display", () => {
    const formatted_size = format_syncable_file_size(
      MAX_SYNCABLE_IMAGE_FILE_BYTES,
    );

    expect(formatted_size).toBe("700KB");
  });

  it("accepts syncable image files", () => {
    const result = validate_syncable_image_file({
      size: MAX_SYNCABLE_IMAGE_FILE_BYTES,
      type: "image/png",
    });

    expect(result).toEqual({ is_valid: true, error_message: null });
  });

  it("rejects oversized image files with sync guidance", () => {
    const result = validate_syncable_image_file({
      size: MAX_SYNCABLE_IMAGE_FILE_BYTES + 1,
      type: "image/png",
    });

    expect(result).toEqual({
      is_valid: false,
      error_message:
        "Image exceeds the sync limit of 700KB. Upload a smaller image and try again.",
    });
    expect(result.error_message).toBe(
      build_syncable_image_file_size_error(MAX_SYNCABLE_IMAGE_FILE_BYTES),
    );
  });
});
