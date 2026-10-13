export const BULK_IMPORT_CSV_DELIMITER = ",";
export const BULK_IMPORT_CSV_QUOTE = '"';
export const BULK_IMPORT_CSV_LINE_BREAK = "\n";
export const BULK_IMPORT_CSV_MIME_TYPE = "text/csv;charset=utf-8;";
export const BULK_IMPORT_FAILURE_REASON_COLUMN = "import_error_reason";
export const BULK_IMPORT_TRUTHY_VALUES: ReadonlySet<string> = new Set([
  "true",
  "1",
]);

export const BULK_IMPORT_EXAMPLE_VALUES = {
  EMAIL: "example@email.com",
  PHONE: "+1234567890",
  NAME: "Example Name",
  TEXT: "text_value",
  YEAR: "2020",
  HEIGHT: "180",
  WEIGHT: "75",
  NUMBER: "0",
  DATE: "2000-01-15",
  BOOLEAN: "true",
  ENUM: "value",
  ENTITY: "entity",
  FOREIGN_KEY_SUFFIX: "_default_1",
  NONE: "",
} as const;

export const BULK_IMPORT_STRING_FIELD_HINTS: ReadonlyArray<
  readonly [string, string]
> = [
  ["email", BULK_IMPORT_EXAMPLE_VALUES.EMAIL],
  ["phone", BULK_IMPORT_EXAMPLE_VALUES.PHONE],
  ["name", BULK_IMPORT_EXAMPLE_VALUES.NAME],
];

export const BULK_IMPORT_NUMBER_FIELD_HINTS: ReadonlyArray<
  readonly [string, string]
> = [
  ["year", BULK_IMPORT_EXAMPLE_VALUES.YEAR],
  ["height", BULK_IMPORT_EXAMPLE_VALUES.HEIGHT],
  ["weight", BULK_IMPORT_EXAMPLE_VALUES.WEIGHT],
];
