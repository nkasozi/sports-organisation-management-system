import type { DynamicEntityListControllerOptions } from "./dynamicEntityListControllerTypes";

type OptionKey = keyof DynamicEntityListControllerOptions;

function are_arrays_item_equal(
  first_items: readonly unknown[],
  second_items: readonly unknown[],
): boolean {
  return (
    first_items.length === second_items.length &&
    first_items.every((item: unknown, index: number) =>
      Object.is(item, second_items[index]),
    )
  );
}

function are_option_values_equal(
  first_value: unknown,
  second_value: unknown,
): boolean {
  if (Object.is(first_value, second_value)) return true;
  if (!Array.isArray(first_value) || !Array.isArray(second_value)) return false;
  return are_arrays_item_equal(first_value, second_value);
}

export function are_dynamic_entity_list_controller_options_equal(
  first_options: DynamicEntityListControllerOptions,
  second_options: DynamicEntityListControllerOptions,
): boolean {
  const option_keys = new Set([
    ...Object.keys(first_options),
    ...Object.keys(second_options),
  ]) as Set<OptionKey>;
  return [...option_keys].every((option_key: OptionKey) =>
    are_option_values_equal(
      first_options[option_key],
      second_options[option_key],
    ),
  );
}
