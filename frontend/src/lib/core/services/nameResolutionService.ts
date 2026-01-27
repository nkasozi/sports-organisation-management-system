import type { GenericEntityUseCases } from "$lib/infrastructure/registry/entityUseCasesRegistry";
import type { BaseEntity } from "$lib/core/entities/BaseEntity";

export interface NameResolutionResult {
  success: boolean;
  resolved_id: string | null;
  error_message: string | null;
}

export interface NameResolutionInput {
  entity_name: string;
  entity_type: string;
  use_cases: GenericEntityUseCases<BaseEntity>;
}

export interface MultipleMatchDetails {
  matches_found: number;
  matched_ids: string[];
}

function build_no_match_error_message(
  entity_name: string,
  entity_type: string,
): string {
  return `Error: No ${entity_type} found with name "${entity_name}". Cause: The name provided does not match any existing ${entity_type} records. Solution: Verify the name spelling, or use the ID column (${entity_type}_id) instead of the name column.`;
}

function build_multiple_matches_error_message(
  entity_name: string,
  entity_type: string,
  matches_found: number,
  matched_ids: string[],
): string {
  const ids_preview = matched_ids.slice(0, 3).join(", ");
  const ids_suffix = matched_ids.length > 3 ? "..." : "";
  return `Error: Multiple ${entity_type}s found with name "${entity_name}" (${matches_found} matches: ${ids_preview}${ids_suffix}). Cause: The name is ambiguous and matches multiple records. Solution: Use the ID column (${entity_type}_id) instead of the name column to specify the exact record.`;
}

function build_empty_name_error_message(entity_type: string): string {
  return `Error: Empty name provided for ${entity_type}. Cause: The name column value is blank or whitespace. Solution: Provide a valid name, or use the ID column (${entity_type}_id) instead.`;
}

function build_success_result(resolved_id: string): NameResolutionResult {
  return {
    success: true,
    resolved_id,
    error_message: null,
  };
}

function build_failure_result(error_message: string): NameResolutionResult {
  return {
    success: false,
    resolved_id: null,
    error_message,
  };
}

function is_empty_or_whitespace(value: string): boolean {
  return !value || value.trim().length === 0;
}

function normalize_name_for_comparison(name: string): string {
  return name.toLowerCase().trim();
}

function extract_entities_from_list_result(list_result: unknown): BaseEntity[] {
  if (!list_result || typeof list_result !== "object") {
    return [];
  }

  const result = list_result as Record<string, unknown>;

  if (!result.data) {
    return [];
  }

  if (Array.isArray(result.data)) {
    return result.data as BaseEntity[];
  }

  const data_obj = result.data as Record<string, unknown>;
  if (data_obj.items && Array.isArray(data_obj.items)) {
    return data_obj.items as BaseEntity[];
  }

  return [];
}

function find_exact_matches_from_entities(
  entities: BaseEntity[],
  search_name: string,
): BaseEntity[] {
  const normalized_search = normalize_name_for_comparison(search_name);
  return entities.filter((entity) => {
    const entity_name = (entity as BaseEntity & { name?: string }).name;
    if (!entity_name) return false;
    return normalize_name_for_comparison(entity_name) === normalized_search;
  });
}

export async function resolve_entity_name_to_id(
  input: NameResolutionInput,
): Promise<NameResolutionResult> {
  const { entity_name, entity_type, use_cases } = input;

  if (is_empty_or_whitespace(entity_name)) {
    return build_failure_result(build_empty_name_error_message(entity_type));
  }

  const trimmed_name = entity_name.trim();

  const list_result = await use_cases.list({ name_contains: trimmed_name });

  if (!list_result.success) {
    const error_msg =
      "error_message" in list_result
        ? list_result.error_message
        : "error" in list_result
          ? list_result.error
          : "Unknown error";
    return build_failure_result(
      `Error: Failed to search for ${entity_type}. Cause: ${error_msg}. Solution: Try again or use the ID column instead.`,
    );
  }

  const entities = extract_entities_from_list_result(list_result);

  const exact_matches = find_exact_matches_from_entities(
    entities,
    trimmed_name,
  );

  if (exact_matches.length === 0) {
    return build_failure_result(
      build_no_match_error_message(trimmed_name, entity_type),
    );
  }

  if (exact_matches.length === 1) {
    return build_success_result(exact_matches[0].id);
  }

  const matched_ids = exact_matches.map((e) => e.id);
  return build_failure_result(
    build_multiple_matches_error_message(
      trimmed_name,
      entity_type,
      exact_matches.length,
      matched_ids,
    ),
  );
}

export async function resolve_multiple_names_to_ids(
  name_resolution_requests: NameResolutionInput[],
): Promise<Map<string, NameResolutionResult>> {
  const results = new Map<string, NameResolutionResult>();

  for (const request of name_resolution_requests) {
    const key = `${request.entity_type}:${request.entity_name}`;
    const result = await resolve_entity_name_to_id(request);
    results.set(key, result);
  }

  return results;
}

export function convert_name_column_to_id_column(column_name: string): string {
  const name_suffix = "_name";
  if (!column_name.endsWith(name_suffix)) {
    return column_name;
  }
  return column_name.slice(0, -name_suffix.length) + "_id";
}

export function is_name_column(column_name: string): boolean {
  return column_name.endsWith("_name");
}

export function extract_entity_type_from_name_column(
  column_name: string,
): string {
  const name_suffix = "_name";
  if (!column_name.endsWith(name_suffix)) {
    return column_name;
  }
  return column_name.slice(0, -name_suffix.length);
}

export function is_id_column(column_name: string): boolean {
  return column_name.endsWith("_id");
}

export function extract_entity_type_from_id_column(
  column_name: string,
): string {
  const id_suffix = "_id";
  if (!column_name.endsWith(id_suffix)) {
    return column_name;
  }
  return column_name.slice(0, -id_suffix.length);
}

export function looks_like_entity_id(value: string): boolean {
  if (!value || value.trim().length === 0) {
    return false;
  }

  const trimmed_value = value.trim();
  const id_pattern = /^[a-z_]+-\d+-[a-z0-9]+$/i;
  const legacy_id_pattern = /^[a-z_]+_default_\d+$/i;

  return (
    id_pattern.test(trimmed_value) || legacy_id_pattern.test(trimmed_value)
  );
}

export function looks_like_entity_name(value: string): boolean {
  if (!value || value.trim().length === 0) {
    return false;
  }

  return !looks_like_entity_id(value);
}
