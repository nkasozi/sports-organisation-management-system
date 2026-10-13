export const NAME_RESOLUTION_LOG_SCOPE = "[NameResolution]";

export const NAME_RESOLUTION_EVENT = {
  SEARCH_FAILED: "name_resolution_search_failed",
  NO_MATCH: "name_resolution_no_match",
  AMBIGUOUS_MATCH: "name_resolution_ambiguous_match",
  RESOLVED: "name_resolution_resolved",
} as const;

export const NAME_COLUMN_SUFFIX = "_name";
export const ID_COLUMN_SUFFIX = "_id";
export const MAX_PREVIEW_MATCHED_IDS = 3;
export const STRING_TYPE_NAME = "string";

export const NAME_RESOLUTION_MESSAGES = {
  no_match: (entity_name: string, entity_type: string): string =>
    `Error: No ${entity_type} found with name "${entity_name}". Cause: The name provided does not match any existing ${entity_type} records. Solution: Verify the name spelling, or use the ID column (${entity_type}_id) instead of the name column.`,
  multiple_matches: (
    entity_name: string,
    entity_type: string,
    matches_found: number,
    ids_preview: string,
  ): string =>
    `Error: Multiple ${entity_type}s found with name "${entity_name}" (${matches_found} matches: ${ids_preview}). Cause: The name is ambiguous and matches multiple records. Solution: Use the ID column (${entity_type}_id) instead of the name column to specify the exact record.`,
  empty_name: (entity_type: string): string =>
    `Error: Empty name provided for ${entity_type}. Cause: The name column value is blank or whitespace. Solution: Provide a valid name, or use the ID column (${entity_type}_id) instead.`,
  search_failed: (entity_type: string, cause: string): string =>
    `Error: Failed to search for ${entity_type}. Cause: ${cause}. Solution: Try again or use the ID column instead.`,
} as const;
