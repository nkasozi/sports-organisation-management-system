export const COMPETITION_STAGE_LOG_SCOPE = "[CompetitionStageUseCases]";

export const COMPETITION_STAGE_LIFECYCLE_LOG_SCOPE =
  "[CompetitionStageLifecycle]";

export const STAGE_LOOKUP_PAGE_SIZE = 100;

export const FIXTURE_PRESENCE_PAGE_SIZE = 1;

export const COMPETITION_STAGE_EVENT = {
  ID_MISSING: "competition_stage_id_missing",
  COMPETITION_ID_MISSING: "competition_stage_competition_id_missing",
  FORMAT_ID_MISSING: "competition_stage_format_id_missing",
  REORDER_IDS_MISSING: "competition_stage_reorder_ids_missing",
  VALIDATION_FAILED: "competition_stage_validation_failed",
  LIST_FAILED: "competition_stage_list_failed",
  LOOKUP_FAILED: "competition_stage_lookup_failed",
  CREATE_FAILED: "competition_stage_create_failed",
  UPDATE_FAILED: "competition_stage_update_failed",
  DELETE_FAILED: "competition_stage_delete_failed",
  REORDER_FAILED: "competition_stage_reorder_failed",
  LINKED_FIXTURES_BLOCK_DELETE:
    "competition_stage_linked_fixtures_block_delete",
  LINKED_FIXTURE_CHECK_FAILED: "competition_stage_linked_fixture_check_failed",
  FIXTURE_CHECK_FAILED: "competition_stage_fixture_check_failed",
  FIXTURES_BLOCK_REPLACEMENT: "competition_stage_fixtures_block_replacement",
  FORMAT_NOT_FOUND: "competition_stage_format_not_found",
  FORMAT_WITHOUT_TEMPLATES: "competition_stage_format_without_templates",
} as const;

export const COMPETITION_STAGE_MESSAGE = {
  STAGE_ID_REQUIRED: "Stage ID is required",
  COMPETITION_ID_REQUIRED: "Competition ID is required",
  FORMAT_ID_REQUIRED: "Competition format ID is required",
  FORMAT_NOT_FOUND: "Competition format not found",
  REORDER_IDS_REQUIRED: "At least one stage ID is required for reordering",
  FIXTURES_BLOCK_REPLACEMENT:
    "Cannot change competition format after fixtures have been created",
} as const;

export function build_format_without_templates_message(
  format_name: string,
): string {
  return `Competition format '${format_name}' has no stage templates`;
}

export function build_linked_fixtures_message(fixture_count: number): string {
  return `Cannot delete stage: it has ${fixture_count} linked fixtures. Remove or reassign them first.`;
}

export function build_reorder_failed_message(
  stage_id: string,
  repository_error: string,
): string {
  return `Failed to update stage order for stage ${stage_id}: ${repository_error}`;
}
