const EMPTY_MESSAGE_PREFIX = "No";
const EMPTY_MESSAGE_SUFFIX = "found.";

export function build_filtered_foreign_key_empty_message(
  field_display_name: string,
): string {
  return `${EMPTY_MESSAGE_PREFIX} ${field_display_name.toLowerCase()} ${EMPTY_MESSAGE_SUFFIX}`;
}
