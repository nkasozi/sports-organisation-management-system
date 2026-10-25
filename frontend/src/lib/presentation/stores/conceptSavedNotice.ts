import { writable } from "svelte/store";

import { find_concept_for_entity_type } from "$lib/presentation/logic/conceptGuideOverview";
import type { ConceptId } from "$lib/presentation/logic/conceptGuideTypes";

export const SAVED_NOTICE_STATUS = {
  NONE: "none",
  SAVED: "saved",
} as const;

type ConceptSavedNotice =
  | { status: typeof SAVED_NOTICE_STATUS.NONE }
  | {
      status: typeof SAVED_NOTICE_STATUS.SAVED;
      concept_id: ConceptId;
      record_label: string;
      target_path: string;
    };

const NO_NOTICE: ConceptSavedNotice = { status: SAVED_NOTICE_STATUS.NONE };
const notice_store = writable<ConceptSavedNotice>(NO_NOTICE);

export const concept_saved_notice = {
  subscribe: notice_store.subscribe,
  clear(): boolean {
    notice_store.set(NO_NOTICE);
    return true;
  },
  leave_path(current_path: string): boolean {
    notice_store.update((notice) =>
      notice.status === SAVED_NOTICE_STATUS.SAVED &&
      notice.target_path !== current_path
        ? NO_NOTICE
        : notice,
    );
    return true;
  },
};

export function announce_saved_record(
  entity_type: string,
  record_label: string,
  target_path: string,
): boolean {
  const concept_id = find_concept_for_entity_type(entity_type);
  if (!concept_id) return false;
  notice_store.set({
    status: SAVED_NOTICE_STATUS.SAVED,
    concept_id,
    record_label,
    target_path,
  });
  return true;
}

export function describe_saved_record(record: object): string {
  const fields = record as Record<string, unknown>;
  const full_name = [fields.first_name, fields.last_name]
    .filter((part) => typeof part === typeof "")
    .join(" ")
    .trim();
  return full_name || String(fields.name ?? "");
}
