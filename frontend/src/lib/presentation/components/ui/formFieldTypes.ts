export const FORM_FIELD_TYPE = {
  TEXT: "text",
  EMAIL: "email",
  TEL: "tel",
  URL: "url",
  NUMBER: "number",
  DATE: "date",
  TIME: "time",
  TEXTAREA: "textarea",
} as const;

export type FormFieldType =
  (typeof FORM_FIELD_TYPE)[keyof typeof FORM_FIELD_TYPE];
