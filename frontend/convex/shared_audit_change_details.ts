import type { FieldChange } from "./shared_audit_types";
import {
  format_object,
  format_value,
  humanize_field_name,
  is_plain_object,
  is_tracked_field,
  NO_VALUE,
} from "./shared_audit_value_format";
import { get_game_event_label } from "./shared_game_event_labels";

type AuditRecord = Readonly<Record<string, unknown>>;

const GAME_EVENTS_FIELD = "game_events";
const EVENT_CORRECTIONS_FIELD = "event_corrections";
const SENSITIVE_FIELD_PATTERN =
  /password|secret|token|pin_hash|identifier_value|document_number/i;
const HIDDEN_VALUE = "•••• (hidden)";
const ITEM_ID_FIELD = "id";
const ITEM_CHANGE = {
  ADDED: "added",
  CHANGED: "changed",
  REMOVED: "removed",
} as const;

function describe_game_event(event: AuditRecord): string {
  const second_player = String(event.secondary_player_name ?? NO_VALUE);
  const players = second_player
    ? `${String(event.player_name ?? NO_VALUE)} → ${second_player}`
    : String(event.player_name ?? NO_VALUE);
  const summary =
    `${get_game_event_label(String(event.event_type ?? NO_VALUE))} ${String(event.minute ?? 0)}' ${players}`.trim();
  return `${summary} (${String(event.team_side ?? NO_VALUE)})`;
}

function describe_event_correction(correction: AuditRecord): string {
  const before = String(correction.event_before ?? NO_VALUE);
  const after = String(correction.event_after ?? NO_VALUE);
  const change = after ? `${before} → ${after}` : before;
  const reason = String(correction.reason ?? NO_VALUE);
  return `${humanize_field_name(String(correction.kind ?? NO_VALUE))}: ${change}${reason ? `. Reason: ${reason}` : ""} (by ${String(correction.corrected_by ?? NO_VALUE)}, ${String(correction.corrected_by_role ?? NO_VALUE)})`;
}

function describe_item(field_name: string, item: AuditRecord): string {
  switch (field_name) {
    case GAME_EVENTS_FIELD:
      return describe_game_event(item);
    case EVENT_CORRECTIONS_FIELD:
      return describe_event_correction(item);
    default:
      return format_object(item);
  }
}

function is_identified_list(value: unknown): value is AuditRecord[] {
  return (
    Array.isArray(value) &&
    value.every((item) => is_plain_object(item) && ITEM_ID_FIELD in item)
  );
}

function index_by_id(items: AuditRecord[]): Map<string, AuditRecord> {
  return new Map(items.map((item) => [String(item[ITEM_ID_FIELD]), item]));
}

function describe_list_changes(
  field_name: string,
  old_items: AuditRecord[],
  new_items: AuditRecord[],
): FieldChange[] {
  const label = humanize_field_name(field_name);
  const old_by_id = index_by_id(old_items);
  const new_by_id = index_by_id(new_items);
  const added_or_changed = new_items.flatMap((item): FieldChange[] => {
    const previous = old_by_id.get(String(item[ITEM_ID_FIELD]));
    const new_value = describe_item(field_name, item);
    if (!previous)
      return [
        {
          field_name: `${label}: ${ITEM_CHANGE.ADDED}`,
          old_value: NO_VALUE,
          new_value,
        },
      ];
    const old_value = describe_item(field_name, previous);
    return old_value === new_value
      ? []
      : [
          {
            field_name: `${label}: ${ITEM_CHANGE.CHANGED}`,
            old_value,
            new_value,
          },
        ];
  });
  const removed = old_items
    .filter((item) => !new_by_id.has(String(item[ITEM_ID_FIELD])))
    .map((item) => ({
      field_name: `${label}: ${ITEM_CHANGE.REMOVED}`,
      old_value: describe_item(field_name, item),
      new_value: NO_VALUE,
    }));
  return [...added_or_changed, ...removed];
}

function mask_sensitive(field_name: string, value: string): string {
  return value && SENSITIVE_FIELD_PATTERN.test(field_name)
    ? HIDDEN_VALUE
    : value;
}

function describe_field_change(
  field_name: string,
  old_value: unknown,
  new_value: unknown,
): FieldChange[] {
  if (
    is_identified_list(old_value ?? []) &&
    is_identified_list(new_value ?? [])
  )
    return describe_list_changes(
      field_name,
      (old_value ?? []) as AuditRecord[],
      (new_value ?? []) as AuditRecord[],
    );
  const before = format_value(old_value);
  const after = format_value(new_value);
  if (before === after) return [];
  return [
    {
      field_name: humanize_field_name(field_name),
      old_value: mask_sensitive(field_name, before),
      new_value: mask_sensitive(field_name, after),
    },
  ];
}

export function describe_created_record(record: AuditRecord): FieldChange[] {
  return Object.keys(record)
    .filter(is_tracked_field)
    .flatMap((field_name) =>
      describe_field_change(field_name, NO_VALUE, record[field_name]),
    );
}

export function describe_deleted_record(record: AuditRecord): FieldChange[] {
  return Object.keys(record)
    .filter(is_tracked_field)
    .flatMap((field_name) =>
      describe_field_change(field_name, record[field_name], NO_VALUE),
    );
}

export function describe_updated_record(
  old_record: AuditRecord,
  new_record: AuditRecord,
): FieldChange[] {
  const field_names = [
    ...new Set([...Object.keys(old_record), ...Object.keys(new_record)]),
  ];
  return field_names
    .filter(is_tracked_field)
    .flatMap((field_name) =>
      describe_field_change(
        field_name,
        old_record[field_name],
        new_record[field_name],
      ),
    );
}
