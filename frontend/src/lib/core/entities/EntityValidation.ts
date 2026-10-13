import {
  type EmailAddress,
  type EntityId,
  type Name,
  parse_email_address,
  parse_entity_id,
  parse_name,
} from "../types/DomainScalars";
import {
  create_failure_result,
  create_success_result,
  type Result,
} from "../types/Result";

const EMPTY_SCALAR_INPUT = "";

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
  return parse_entity_id(raw_value ?? EMPTY_SCALAR_INPUT, error_message);
}

export function check_required_name(
  raw_value: string | undefined,
  error_message: string,
): Result<Name> {
  return parse_name(raw_value ?? EMPTY_SCALAR_INPUT, error_message);
}

export function check_required_email_address(
  raw_value: string | undefined,
  error_message: string,
): Result<EmailAddress> {
  return parse_email_address(raw_value ?? EMPTY_SCALAR_INPUT, error_message);
}

export function check_optional_email_address(
  raw_value: string,
  error_message: string,
): FieldCheck {
  return raw_value.length === 0
    ? create_success_result(true)
    : parse_email_address(raw_value, error_message);
}

export function check_minimum_text_length(
  raw_value: string | undefined,
  minimum_length: number,
  error_message: string,
): Result<true> {
  return check_condition(
    (raw_value ?? EMPTY_SCALAR_INPUT).trim().length >= minimum_length,
    error_message,
  );
}

export function is_blank_text(raw_value: string | undefined): boolean {
  return (raw_value ?? EMPTY_SCALAR_INPUT).trim().length === 0;
}
