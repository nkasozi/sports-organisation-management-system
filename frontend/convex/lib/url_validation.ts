const ALLOWED_URL_PROTOCOLS = ["https:", "http:"];

const IMAGE_DATA_URL_FIELD_PATTERN =
  /(logo|image|avatar|photo|picture|document)_url$/;
const RELATIVE_ASSET_FIELD_EXACT_NAMES = ["background_pattern_url"];
const URL_FIELD_SUFFIXES = ["_url"];
const URL_FIELD_EXACT_NAMES = ["website"];

function is_url_field_name(field_name: string): boolean {
  const lower_name = field_name.toLowerCase();
  const matches_suffix = URL_FIELD_SUFFIXES.some((suffix) =>
    lower_name.endsWith(suffix),
  );
  const matches_exact = URL_FIELD_EXACT_NAMES.includes(lower_name);
  return matches_suffix || matches_exact;
}

interface UrlValidationResult {
  is_valid: boolean;
  error: string;
}

function create_valid_url_validation_result(): UrlValidationResult {
  return { is_valid: true, error: "" };
}

function create_invalid_url_validation_result(
  error: string,
): UrlValidationResult {
  return { is_valid: false, error };
}

function is_empty_url_field_value(value: unknown): boolean {
  if (typeof value === "string") {
    return value === "";
  }

  if (typeof value === "object") {
    return !value;
  }

  return value === void 0;
}

function is_image_data_url_field_name(field_name: string): boolean {
  return IMAGE_DATA_URL_FIELD_PATTERN.test(field_name.toLowerCase());
}

function is_allowed_image_data_url(field_name: string, value: string): boolean {
  return (
    is_image_data_url_field_name(field_name) &&
    value.toLowerCase().startsWith("data:image/")
  );
}

function is_allowed_relative_asset_url(
  field_name: string,
  value: string,
): boolean {
  return (
    RELATIVE_ASSET_FIELD_EXACT_NAMES.includes(field_name.toLowerCase()) &&
    value.startsWith("/")
  );
}

export function validate_url_field_value(
  field_name: string,
  value: unknown,
): UrlValidationResult {
  if (is_empty_url_field_value(value)) {
    return create_valid_url_validation_result();
  }

  if (typeof value !== "string") {
    return create_invalid_url_validation_result(
      `URL field "${field_name}" must be a string`,
    );
  }

  if (is_allowed_image_data_url(field_name, value)) {
    return create_valid_url_validation_result();
  }

  if (is_allowed_relative_asset_url(field_name, value)) {
    return create_valid_url_validation_result();
  }

  let parsed_url: URL;
  try {
    parsed_url = new URL(value);
  } catch (error) {
    console.warn("[UrlValidation] Failed to parse URL", {
      event: "url_parse_failed",
      field_name,
      error: String(error),
    });
    return create_invalid_url_validation_result(
      `URL field "${field_name}" contains an invalid URL`,
    );
  }

  const is_allowed_protocol = ALLOWED_URL_PROTOCOLS.includes(
    parsed_url.protocol,
  );
  if (!is_allowed_protocol) {
    return create_invalid_url_validation_result(
      `URL field "${field_name}" uses disallowed protocol "${parsed_url.protocol}"`,
    );
  }

  return create_valid_url_validation_result();
}

export function validate_record_url_fields(
  record_data: Record<string, unknown>,
): UrlValidationResult {
  for (const [field_name, field_value] of Object.entries(record_data)) {
    if (!is_url_field_name(field_name)) {
      continue;
    }
    const validation = validate_url_field_value(field_name, field_value);
    if (!validation.is_valid) {
      return validation;
    }
  }
  return create_valid_url_validation_result();
}
