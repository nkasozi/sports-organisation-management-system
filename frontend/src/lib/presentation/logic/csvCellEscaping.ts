const CSV_FORMULA_TRIGGER_CHARACTERS: readonly string[] = [
  "=",
  "+",
  "-",
  "@",
  "\t",
  "\r",
];
const CSV_FORMULA_NEUTRALISING_PREFIX = "'";
const CSV_QUOTE = '"';
const CSV_ESCAPED_QUOTE = '""';

function neutralise_csv_formula_value(value: string): string {
  const starts_with_formula_trigger = CSV_FORMULA_TRIGGER_CHARACTERS.some(
    (trigger_character: string) => value.startsWith(trigger_character),
  );
  return starts_with_formula_trigger
    ? `${CSV_FORMULA_NEUTRALISING_PREFIX}${value}`
    : value;
}

export function escape_csv_cell_value(value: string): string {
  const neutralised_value = neutralise_csv_formula_value(value);
  return `${CSV_QUOTE}${neutralised_value.replaceAll(CSV_QUOTE, CSV_ESCAPED_QUOTE)}${CSV_QUOTE}`;
}
