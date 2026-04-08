const ALLOWED_URL_PROTOCOLS = ["https:", "http:"];

const IMAGE_DATA_URL_FIELD_PATTERN =
  /(logo|image|avatar|photo|picture|document)_url$/;
const RELATIVE_ASSET_FIELD_EXACT_NAMES = ["background_pattern_url"];
const URL_FIELD_SUFFIXES = ["_url"];
const URL_FIELD_EXACT_NAMES = ["website"];

export function is_url_field_name(field_name: string): boolean {
  const lower_name = field_name.toLowerCase();
  const matches_suffix = URL_FIELD_SUFFIXES.some((suffix) =>
    lower_name.endsWith(suffix),
  );
  const matches_exact = URL_FIELD_EXACT_NAMES.includes(lower_name);
  return matches_suffix || matches_exact;
}

export interface UrlValidationResult {
  is_valid: boolean;
  error: string | null;
}

function is_image_data_url_field_name(field_name: string): boolean {
  return IMAGE_DATA_URL_FIELD_PATTERN.test(field_name.toLowerCase());
}

function is_allowed_image_data_url(
  field_name: string,
  value: string,
): boolean {
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
  if (value === null || value === undefined || value === "") {
    return { is_valid: true, error: null };
  }

  if (typeof value !== "string") {
    return {
      is_valid: false,
      error: `URL field "${field_name}" must be a string`,
    };
  }

  if (is_allowed_image_data_url(field_name, value)) {
    return { is_valid: true, error: null };
  }

  if (is_allowed_relative_asset_url(field_name, value)) {
    return { is_valid: true, error: null };
  }

  let parsed_url: URL;
  try {
    parsed_url = new URL(value);
  } catch {
    return {
      is_valid: false,
      error: `URL field "${field_name}" contains an invalid URL`,
    };
  }

  const is_allowed_protocol = ALLOWED_URL_PROTOCOLS.includes(
    parsed_url.protocol,
  );
  if (!is_allowed_protocol) {
    return {
      is_valid: false,
      error: `URL field "${field_name}" uses disallowed protocol "${parsed_url.protocol}"`,
    };
  }

  return { is_valid: true, error: null };
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
  return { is_valid: true, error: null };
}
