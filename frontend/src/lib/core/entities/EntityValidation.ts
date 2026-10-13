import {
  type EmailAddress,
  type EntityId,
  type Name,
  parse_email_address,
  parse_entity_id,
  parse_name,
} from "../types/DomainScalars";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "../types/Option";
import {
  create_failure_result,
  create_success_result,
  type Result,
} from "../types/Result";
import { normalize_scalar_input } from "../types/ScalarInfrastructure";

export type FieldCheck = Result<unknown>;

export function collect_validation_errors(
  checks: ReadonlyArray<FieldCheck>,
): string[] {
  return checks.flatMap((check) => (check.success ? [] : [check.error]));
}

export function check_condition(
  is_valid: boolean,
  error_message: string,
): Result<true> {
  return is_valid
    ? create_success_result(true)
    : create_failure_result(error_message);
}

export function check_required_entity_id(
  raw_value: string | undefined,
  error_message: string,
): Result<EntityId> {
  return parse_entity_id(
    normalize_scalar_input(raw_value as string),
    error_message,
  );
}

export function check_required_name(
  raw_value: string | undefined,
  error_message: string,
): Result<Name> {
  return parse_name(normalize_scalar_input(raw_value as string), error_message);
}

export function check_required_email_address(
  raw_value: string | undefined,
  error_message: string,
): Result<EmailAddress> {
  return parse_email_address(
    normalize_scalar_input(raw_value as string),
    error_message,
  );
}

export function check_optional_email_address(
  raw_value: string | undefined,
  error_message: string,
): FieldCheck {
  const normalized_value = normalize_scalar_input(raw_value as string);
  return normalized_value.length === 0
    ? create_success_result(true)
    : parse_email_address(normalized_value, error_message);
}

export function check_minimum_text_length(
  raw_value: string | undefined,
  minimum_length: number,
  error_message: string,
): Result<true> {
  return check_condition(
    normalize_scalar_input(raw_value as string).length >= minimum_length,
    error_message,
  );
}

export function is_blank_text(raw_value: string | undefined): boolean {
  return normalize_scalar_input(raw_value as string).length === 0;
}

const NUMBER_TYPE_NAME = "number";
const STRING_TYPE_NAME = "string";

type NumericParser = (raw_value: number, error_message: string) => FieldCheck;

function read_provided_number(raw_value: unknown): Option<number> {
  if (typeof raw_value === NUMBER_TYPE_NAME) {
    return create_some_option(raw_value as number);
  }
  const is_text = typeof raw_value === STRING_TYPE_NAME;
  const trimmed_text = is_text ? (raw_value as string).trim() : "";
  return trimmed_text.length > 0
    ? create_some_option(Number(trimmed_text))
    : create_none_option();
}

export function check_optional_numeric_value(
  raw_value: unknown,
  parse_value: NumericParser,
  error_message: string,
): FieldCheck {
  const provided_number = read_provided_number(raw_value);
  switch (provided_number.status) {
    case OptionStatus.NONE:
      return create_success_result(true);
    case OptionStatus.SOME:
      return parse_value(provided_number.value, error_message);
  }
}
