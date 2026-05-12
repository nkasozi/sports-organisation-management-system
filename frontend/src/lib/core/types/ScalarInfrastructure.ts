import {
  create_failure_result,
  create_success_result,
  type Result,
} from "./Result";

export type BrandedString<TBrand extends string> = string & {
  readonly __brand: TBrand;
};

export type BrandedNumber<TBrand extends string> = number & {
  readonly __brand: TBrand;
};

type ScalarInputValue<TValue> =
  TValue extends BrandedString<string>
    ? string
    : TValue extends BrandedNumber<string>
      ? number
      : TValue extends Array<infer TElement>
        ? Array<ScalarInputValue<TElement>>
        : TValue extends ReadonlyArray<infer TElement>
          ? ReadonlyArray<ScalarInputValue<TElement>>
          : TValue extends object
            ? { [TKey in keyof TValue]: ScalarInputValue<TValue[TKey]> }
            : TValue;

export type ScalarValueInput<TValue> = ScalarInputValue<TValue>;

export type ScalarInput<TValue> = {
  [TKey in keyof TValue]: ScalarInputValue<TValue[TKey]>;
};

type ParseStringCommand<TValue extends string> = {
  raw_value: string;
  invalid_error: string;
  allow_empty?: boolean;
  maximum_length?: number;
  pattern?: RegExp;
  disallowed_values?: ReadonlySet<string>;
};

type ParseNumberCommand<TValue extends number> = {
  raw_value: number;
  invalid_error: string;
  maximum?: number;
  minimum: number;
  require_integer?: boolean;
};

export function normalize_scalar_input(raw_value: string): string {
  return raw_value.trim();
}

export function parse_string_value<TValue extends string>(
  command: ParseStringCommand<TValue>,
): Result<TValue> {
  const normalized_value = normalize_scalar_input(command.raw_value);

  if (!command.allow_empty && normalized_value.length === 0) {
    return create_failure_result(command.invalid_error);
  }

  if (
    command.maximum_length !== undefined &&
    normalized_value.length > command.maximum_length
  ) {
    return create_failure_result(command.invalid_error);
  }

  if (command.disallowed_values?.has(normalized_value)) {
    return create_failure_result(command.invalid_error);
  }

  if (command.pattern && !command.pattern.test(normalized_value)) {
    return create_failure_result(command.invalid_error);
  }

  return create_success_result(normalized_value as TValue);
}

export function parse_number_value<TValue extends number>(
  command: ParseNumberCommand<TValue>,
): Result<TValue> {
  if (!Number.isFinite(command.raw_value)) {
    return create_failure_result(command.invalid_error);
  }

  if (command.require_integer && !Number.isInteger(command.raw_value)) {
    return create_failure_result(command.invalid_error);
  }

  if (command.raw_value < command.minimum) {
    return create_failure_result(command.invalid_error);
  }

  if (command.maximum !== undefined && command.raw_value > command.maximum) {
    return create_failure_result(command.invalid_error);
  }

  return create_success_result(command.raw_value as TValue);
}
