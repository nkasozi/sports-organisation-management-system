const BLANK_FORM_VALUE = "";

function is_value_provided(
  field_name: string,
  value: unknown,
  defaults: object,
): boolean {
  if (value === undefined) return false;
  const has_default = Object.prototype.hasOwnProperty.call(
    defaults,
    field_name,
  );
  return !(has_default && value === BLANK_FORM_VALUE);
}

export function apply_entity_input_defaults<TInput extends object>(
  defaults: Partial<TInput>,
  input: TInput,
): TInput {
  const provided_fields = Object.fromEntries(
    Object.entries(input).filter(([field_name, value]) =>
      is_value_provided(field_name, value, defaults),
    ),
  );
  return { ...defaults, ...provided_fields } as TInput;
}
