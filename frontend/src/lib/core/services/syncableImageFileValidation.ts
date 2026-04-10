const ONE_KIBIBYTE = 1024;
const ONE_MEBIBYTE = ONE_KIBIBYTE * ONE_KIBIBYTE;
const IMAGE_MIME_TYPE_PREFIX = "image/";
const INVALID_IMAGE_FILE_MESSAGE = "Please select an image file";
const SYNC_IMAGE_LIMIT_MESSAGE_PREFIX = "Image exceeds the sync limit of";
const SYNC_IMAGE_LIMIT_MESSAGE_SUFFIX = "Upload a smaller image and try again.";

export const MAX_SYNCABLE_IMAGE_FILE_BYTES = 700 * ONE_KIBIBYTE;

interface SyncableImageFileValidationResult {
  is_valid: boolean;
  error_message: string | null;
}

export function format_syncable_file_size(size_bytes: number): string {
  if (size_bytes % ONE_MEBIBYTE === 0) {
    return `${size_bytes / ONE_MEBIBYTE}MB`;
  }
  return `${Math.round(size_bytes / ONE_KIBIBYTE)}KB`;
}

export function build_syncable_image_file_size_error(
  max_size_bytes: number = MAX_SYNCABLE_IMAGE_FILE_BYTES,
): string {
  return `${SYNC_IMAGE_LIMIT_MESSAGE_PREFIX} ${format_syncable_file_size(max_size_bytes)}. ${SYNC_IMAGE_LIMIT_MESSAGE_SUFFIX}`;
}

export function validate_syncable_image_file(
  file: Pick<File, "size" | "type">,
  max_size_bytes: number = MAX_SYNCABLE_IMAGE_FILE_BYTES,
): SyncableImageFileValidationResult {
  if (!file.type.startsWith(IMAGE_MIME_TYPE_PREFIX)) {
    return {
      is_valid: false,
      error_message: INVALID_IMAGE_FILE_MESSAGE,
    };
  }

  if (file.size > max_size_bytes) {
    return {
      is_valid: false,
      error_message: build_syncable_image_file_size_error(max_size_bytes),
    };
  }

  return { is_valid: true, error_message: null };
}
