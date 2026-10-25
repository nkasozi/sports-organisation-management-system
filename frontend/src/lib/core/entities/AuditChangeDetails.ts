import type { FieldChange } from "./AuditLog";
import {
  format_object,
  format_value,
  humanize_field_name,
  is_plain_object,
  is_tracked_field,
  NO_VALUE,
} from "./AuditValueFormat";
import { get_event_label } from "./FixtureGameEvents";
import type { GameEventType } from "./FixtureTypes";

type AuditRecord = Readonly<Record<string, unknown>>;

const GAME_EVENTS_FIELD = "game_events";
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
    `${get_event_label(event.event_type as GameEventType)} ${String(event.minute ?? 0)}' ${players}`.trim();
  return `${summary} (${String(event.team_side ?? NO_VALUE)})`;
}

function describe_item(field_name: string, item: AuditRecord): string {
  return field_name === GAME_EVENTS_FIELD
    ? describe_game_event(item)
    : format_object(item);
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
