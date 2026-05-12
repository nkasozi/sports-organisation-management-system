import {
  create_failure_result,
  create_success_result,
  type Result,
} from "./Result";
import {
  type BrandedString,
  normalize_scalar_input,
} from "./ScalarInfrastructure";

export type EmptyUrlValue = BrandedString<"EmptyUrlValue">;
export type HttpUrlValue = BrandedString<"HttpUrlValue">;
export type ImageDataUrlValue = BrandedString<"ImageDataUrlValue">;
export type RelativeAssetPathValue = BrandedString<"RelativeAssetPathValue">;
export type OptionalHttpUrlValue = HttpUrlValue | EmptyUrlValue;
export type OptionalMediaUrlValue =
  | EmptyUrlValue
  | HttpUrlValue
  | ImageDataUrlValue
  | RelativeAssetPathValue;

const INVALID_HTTP_URL_VALUE_ERROR = "HTTP URL value is invalid";
const INVALID_IMAGE_DATA_URL_VALUE_ERROR = "Image data URL value is invalid";
const INVALID_MEDIA_URL_VALUE_ERROR = "Media URL value is invalid";
const INVALID_RELATIVE_ASSET_PATH_VALUE_ERROR =
  "Relative asset path value is invalid";
const EMPTY_URL_VALUE = "";
const HTTP_PROTOCOL = "http:";
const HTTPS_PROTOCOL = "https:";
const IMAGE_DATA_URL_PREFIX = "data:image/";
const RELATIVE_ASSET_PATH_PREFIX = "/";
const RELATIVE_ASSET_PATH_NETWORK_PREFIX = "//";
const URL_VALUE_SEPARATOR = ",";

function create_empty_url_value(): EmptyUrlValue {
  return EMPTY_URL_VALUE as EmptyUrlValue;
}

export function parse_http_url_value(
  raw_value: string,
  invalid_error: string = INVALID_HTTP_URL_VALUE_ERROR,
): Result<HttpUrlValue> {
  const normalized_value = normalize_scalar_input(raw_value);

  if (normalized_value.length === 0) {
    return create_failure_result(invalid_error);
  }

  if (!URL.canParse(normalized_value)) {
    return create_failure_result(invalid_error);
  }

  const parsed_url = new URL(normalized_value);

  if (
    parsed_url.protocol !== HTTP_PROTOCOL &&
    parsed_url.protocol !== HTTPS_PROTOCOL
  ) {
    return create_failure_result(invalid_error);
  }

  return create_success_result(normalized_value as HttpUrlValue);
}

function parse_relative_asset_path_value(
  raw_value: string,
  invalid_error: string = INVALID_RELATIVE_ASSET_PATH_VALUE_ERROR,
): Result<RelativeAssetPathValue> {
  const normalized_value = normalize_scalar_input(raw_value);

  if (
    normalized_value.length === 0 ||
    !normalized_value.startsWith(RELATIVE_ASSET_PATH_PREFIX) ||
    normalized_value.startsWith(RELATIVE_ASSET_PATH_NETWORK_PREFIX)
  ) {
    return create_failure_result(invalid_error);
  }

  return create_success_result(normalized_value as RelativeAssetPathValue);
}

function parse_image_data_url_value(
  raw_value: string,
  invalid_error: string = INVALID_IMAGE_DATA_URL_VALUE_ERROR,
): Result<ImageDataUrlValue> {
  const normalized_value = normalize_scalar_input(raw_value);
  const normalized_lower_value = normalized_value.toLowerCase();

  if (
    !normalized_lower_value.startsWith(IMAGE_DATA_URL_PREFIX) ||
    !normalized_value.includes(URL_VALUE_SEPARATOR)
  ) {
    return create_failure_result(invalid_error);
  }

  return create_success_result(normalized_value as ImageDataUrlValue);
}

export function parse_optional_http_url_value(
  raw_value: string,
  invalid_error: string = INVALID_HTTP_URL_VALUE_ERROR,
): Result<OptionalHttpUrlValue> {
  const normalized_value = normalize_scalar_input(raw_value);

  if (normalized_value.length === 0) {
    return create_success_result(create_empty_url_value());
  }

  return parse_http_url_value(normalized_value, invalid_error);
}

export function parse_optional_media_url_value(
  raw_value: string,
  invalid_error: string = INVALID_MEDIA_URL_VALUE_ERROR,
): Result<OptionalMediaUrlValue> {
  const normalized_value = normalize_scalar_input(raw_value);
  const normalized_lower_value = normalized_value.toLowerCase();

  if (normalized_value.length === 0) {
    return create_success_result(create_empty_url_value());
  }

  if (normalized_lower_value.startsWith(IMAGE_DATA_URL_PREFIX)) {
    return parse_image_data_url_value(normalized_value, invalid_error);
  }

  if (normalized_value.startsWith(RELATIVE_ASSET_PATH_PREFIX)) {
    return parse_relative_asset_path_value(normalized_value, invalid_error);
  }

  return parse_http_url_value(normalized_value, invalid_error);
}
