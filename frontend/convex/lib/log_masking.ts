const EMAIL_AT_SYMBOL = "@";
const MASKED_SEGMENT = "***";
const FIRST_CHARACTER_INDEX = 0;

export function mask_email_for_logging(email: string): string {
  const at_index = email.indexOf(EMAIL_AT_SYMBOL);
  if (at_index <= FIRST_CHARACTER_INDEX) return MASKED_SEGMENT;
  return `${email[FIRST_CHARACTER_INDEX]}${MASKED_SEGMENT}${email.substring(at_index)}`;
}
