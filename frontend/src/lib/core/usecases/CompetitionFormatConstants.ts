export const COMPETITION_FORMAT_LOG_SCOPE = "[CompetitionFormatUseCases]";

export const COMPETITION_FORMAT_EVENT = {
  ID_MISSING: "competition_format_id_missing",
  VALIDATION_FAILED: "competition_format_validation_failed",
  NOT_FOUND: "competition_format_not_found",
  CODE_TAKEN: "competition_format_code_taken",
  CODE_LOOKUP_FAILED: "competition_format_code_lookup_failed",
  LIST_FAILED: "competition_format_list_failed",
  LOOKUP_FAILED: "competition_format_lookup_failed",
  CREATE_FAILED: "competition_format_create_failed",
  UPDATE_FAILED: "competition_format_update_failed",
  DELETE_FAILED: "competition_format_delete_failed",
} as const;

export const COMPETITION_FORMAT_MESSAGE = {
  ID_REQUIRED: "Format ID is required",
  NOT_FOUND: "Format not found",
} as const;

export function build_format_code_taken_message(code: string): string {
  return `Format with code '${code}' already exists`;
}
