import type { BaseEntity } from "$lib/core/entities/BaseEntity";
import type { PaginatedAsyncResult } from "$lib/core/types/Result";

import {
  ID_COLUMN_SUFFIX,
  MAX_PREVIEW_MATCHED_IDS,
  NAME_COLUMN_SUFFIX,
  NAME_RESOLUTION_EVENT,
  NAME_RESOLUTION_LOG_SCOPE,
  NAME_RESOLUTION_MESSAGES,
  STRING_TYPE_NAME,
} from "./NameResolutionConstants";

export type NameResolutionResult =
  | { success: true; resolved_id: string }
  | { success: false; error_message: string };

export interface NameSearchUseCases {
  list(filter?: Record<string, unknown>): PaginatedAsyncResult<BaseEntity>;
}

export interface NameResolutionInput {
  entity_name: string;
  entity_type: string;
  use_cases: NameSearchUseCases;
}

function build_ids_preview(matched_ids: string[]): string {
  const ids_preview = matched_ids.slice(0, MAX_PREVIEW_MATCHED_IDS).join(", ");
  return matched_ids.length > MAX_PREVIEW_MATCHED_IDS
    ? `${ids_preview}...`
    : ids_preview;
}

function build_failure_result(
  event: string,
  context: Record<string, unknown>,
  error_message: string,
): NameResolutionResult {
  console.warn(NAME_RESOLUTION_LOG_SCOPE, { event, ...context });
  return { success: false, error_message };
}

function is_empty_or_whitespace(value: string): boolean {
  return !value || value.trim().length === 0;
}

function normalize_name_for_comparison(name: string): string {
  return name.toLowerCase().trim();
}

function read_entity_name(entity: BaseEntity): string {
  const candidate: unknown = (entity as BaseEntity & { name?: unknown }).name;
  return typeof candidate === STRING_TYPE_NAME ? String(candidate) : "";
}

function find_exact_matches_from_entities(
  entities: BaseEntity[],
  search_name: string,
): BaseEntity[] {
  const normalized_search = normalize_name_for_comparison(search_name);
  return entities.filter((entity) => {
    const entity_name = read_entity_name(entity);
    return (
      entity_name.length > 0 &&
      normalize_name_for_comparison(entity_name) === normalized_search
    );
  });
}

function resolve_from_matches(
  exact_matches: BaseEntity[],
  trimmed_name: string,
  entity_type: string,
): NameResolutionResult {
  const messages = NAME_RESOLUTION_MESSAGES;
  const [only_match] = exact_matches;
  if (!only_match) {
    return build_failure_result(
      NAME_RESOLUTION_EVENT.NO_MATCH,
      { entity_type },
      messages.no_match(trimmed_name, entity_type),
    );
  }
  if (exact_matches.length > 1) {
    const matched_ids = exact_matches.map((e) => e.id);
    return build_failure_result(
      NAME_RESOLUTION_EVENT.AMBIGUOUS_MATCH,
      { entity_type, matches_found: exact_matches.length },
      messages.multiple_matches(
        trimmed_name,
        entity_type,
        exact_matches.length,
        build_ids_preview(matched_ids),
      ),
    );
  }
  console.debug(NAME_RESOLUTION_LOG_SCOPE, {
    event: NAME_RESOLUTION_EVENT.RESOLVED,
    entity_type,
    resolved_id: only_match.id,
  });
  return { success: true, resolved_id: only_match.id };
}

export async function resolve_entity_name_to_id(
  input: NameResolutionInput,
): Promise<NameResolutionResult> {
  const { entity_name, entity_type, use_cases } = input;
  if (is_empty_or_whitespace(entity_name)) {
    return {
      success: false,
      error_message: NAME_RESOLUTION_MESSAGES.empty_name(entity_type),
    };
  }
  const trimmed_name = entity_name.trim();
  const list_result = await use_cases.list({ name_contains: trimmed_name });
  if (!list_result.success) {
    console.error(NAME_RESOLUTION_LOG_SCOPE, {
      event: NAME_RESOLUTION_EVENT.SEARCH_FAILED,
      entity_type,
      error: list_result.error,
    });
    return {
      success: false,
      error_message: NAME_RESOLUTION_MESSAGES.search_failed(
        entity_type,
        list_result.error,
      ),
    };
  }
  return resolve_from_matches(
    find_exact_matches_from_entities(list_result.data.items, trimmed_name),
    trimmed_name,
    entity_type,
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
  return column_name.endsWith(NAME_COLUMN_SUFFIX)
    ? column_name.slice(0, -NAME_COLUMN_SUFFIX.length) + ID_COLUMN_SUFFIX
    : column_name;
}

export function is_name_column(column_name: string): boolean {
  return column_name.endsWith(NAME_COLUMN_SUFFIX);
}

export function extract_entity_type_from_name_column(
  column_name: string,
): string {
  return column_name.endsWith(NAME_COLUMN_SUFFIX)
    ? column_name.slice(0, -NAME_COLUMN_SUFFIX.length)
    : column_name;
}

export function is_id_column(column_name: string): boolean {
  return column_name.endsWith(ID_COLUMN_SUFFIX);
}

export function extract_entity_type_from_id_column(
  column_name: string,
): string {
  return column_name.endsWith(ID_COLUMN_SUFFIX)
    ? column_name.slice(0, -ID_COLUMN_SUFFIX.length)
    : column_name;
}

export function looks_like_entity_id(value: string): boolean {
  if (!value || value.trim().length === 0) return false;
  const trimmed_value = value.trim();
  return (
    /^[a-z_]+-\d+-[a-z0-9]+$/i.test(trimmed_value) ||
    /^[a-z_]+_default_\d+$/i.test(trimmed_value)
  );
}

export function looks_like_entity_name(value: string): boolean {
  return !!value && value.trim().length > 0 && !looks_like_entity_id(value);
}
