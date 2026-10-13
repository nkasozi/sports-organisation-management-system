import { is_object_record } from "./value_guards";
export const OptionStatus = {
  SOME: "some",
  NONE: "none",
} as const;

export type Option<TValue> =
  | { status: typeof OptionStatus.SOME; value: TValue }
  | { status: typeof OptionStatus.NONE };

export function create_some_option<TValue>(value: TValue): Option<TValue> {
  return { status: OptionStatus.SOME, value };
}

export function create_none_option<TValue>(): Option<TValue> {
  return { status: OptionStatus.NONE };
}

export function option_from_document(
  value: unknown,
): Option<Record<string, unknown>> {
  return is_object_record(value)
    ? create_some_option(value)
    : create_none_option();
}
