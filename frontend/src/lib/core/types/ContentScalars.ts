import { type Result } from "./Result";
import {
  type BrandedNumber,
  type BrandedString,
  parse_number_value,
  parse_string_value,
} from "./ScalarInfrastructure";

export type DescriptionText = BrandedString<"DescriptionText">;
export type HexColorValue = BrandedString<"HexColorValue">;
export type NonNegativeIntegerValue = BrandedNumber<"NonNegativeIntegerValue">;
export type PositiveIntegerValue = BrandedNumber<"PositiveIntegerValue">;
export type YearValue = BrandedNumber<"YearValue">;

const DESCRIPTION_MAXIMUM_LENGTH = 1_000;
const HEX_COLOR_PATTERN = /^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

const INVALID_DESCRIPTION_TEXT_ERROR = "Description text is invalid";
const INVALID_HEX_COLOR_VALUE_ERROR = "Hex color value is invalid";
const INVALID_NON_NEGATIVE_INTEGER_VALUE_ERROR =
  "Non-negative integer value is invalid";
const INVALID_POSITIVE_INTEGER_VALUE_ERROR =
  "Positive integer value is invalid";
const INVALID_YEAR_VALUE_ERROR = "Year value is invalid";

export function parse_description_text(
  raw_value: string,
  invalid_error: string = INVALID_DESCRIPTION_TEXT_ERROR,
): Result<DescriptionText> {
  return parse_string_value<DescriptionText>({
    raw_value,
    invalid_error,
    allow_empty: true,
    maximum_length: DESCRIPTION_MAXIMUM_LENGTH,
  });
}

export function parse_hex_color_value(
  raw_value: string,
  invalid_error: string = INVALID_HEX_COLOR_VALUE_ERROR,
): Result<HexColorValue> {
  return parse_string_value<HexColorValue>({
    raw_value,
    invalid_error,
    pattern: HEX_COLOR_PATTERN,
  });
}

export function parse_non_negative_integer_value(
  raw_value: number,
  invalid_error: string = INVALID_NON_NEGATIVE_INTEGER_VALUE_ERROR,
): Result<NonNegativeIntegerValue> {
  return parse_number_value<NonNegativeIntegerValue>({
    raw_value,
    invalid_error,
    minimum: 0,
    require_integer: true,
  });
}

export function parse_positive_integer_value(
  raw_value: number,
  invalid_error: string = INVALID_POSITIVE_INTEGER_VALUE_ERROR,
): Result<PositiveIntegerValue> {
  return parse_number_value<PositiveIntegerValue>({
    raw_value,
    invalid_error,
    minimum: 1,
    require_integer: true,
  });
}

export function parse_year_value(
  raw_value: number,
  invalid_error: string = INVALID_YEAR_VALUE_ERROR,
): Result<YearValue> {
  return parse_number_value<YearValue>({
    raw_value,
    invalid_error,
    minimum: 1_000,
    maximum: 9_999,
    require_integer: true,
  });
}
