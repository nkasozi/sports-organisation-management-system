import { is_number } from "./value_guards";
export const DEFAULT_CHANGE_PAGE_SIZE = 100;
export const MAX_CHANGE_PAGE_SIZE = 200;
const MIN_CHANGE_PAGE_SIZE = 1;

const ChangeFeedEntryKind = {
  RECORD: "record",
  TOMBSTONE: "tombstone",
} as const;

interface SequencedRow {
  sync_sequence?: number;
}

type ChangeFeedEntry<TRecord, TTombstone> =
  | {
      kind: typeof ChangeFeedEntryKind.RECORD;
      sync_sequence: number;
      row: TRecord;
    }
  | {
      kind: typeof ChangeFeedEntryKind.TOMBSTONE;
      sync_sequence: number;
      row: TTombstone;
    };

interface ChangeFeedPage<TRecord, TTombstone> {
  records: TRecord[];
  tombstones: TTombstone[];
  next_cursor: number;
  has_more: boolean;
}

const MISSING_SEQUENCE = 0;

export function clamp_change_page_size(requested_page_size: number): number {
  if (!Number.isFinite(requested_page_size)) return DEFAULT_CHANGE_PAGE_SIZE;
  return Math.min(
    MAX_CHANGE_PAGE_SIZE,
    Math.max(MIN_CHANGE_PAGE_SIZE, Math.floor(requested_page_size)),
  );
}

function read_sequence(row: SequencedRow): number {
  return is_number(row.sync_sequence) ? row.sync_sequence : MISSING_SEQUENCE;
}

export function merge_change_feed_page<
  TRecord extends SequencedRow,
  TTombstone extends SequencedRow,
>(command: {
  records: TRecord[];
  tombstones: TTombstone[];
  page_size: number;
  after_sequence: number;
}): ChangeFeedPage<TRecord, TTombstone> {
  const entries: Array<ChangeFeedEntry<TRecord, TTombstone>> = [
    ...command.records.map((row) => ({
      kind: ChangeFeedEntryKind.RECORD,
      sync_sequence: read_sequence(row),
      row,
    })),
    ...command.tombstones.map((row) => ({
      kind: ChangeFeedEntryKind.TOMBSTONE,
      sync_sequence: read_sequence(row),
      row,
    })),
  ].sort((left, right) => left.sync_sequence - right.sync_sequence);
  const page_entries = entries.slice(0, command.page_size);
  const last_entry = page_entries[page_entries.length - 1];
  return {
    records: page_entries.flatMap((entry) =>
      entry.kind === ChangeFeedEntryKind.RECORD ? [entry.row] : [],
    ),
    tombstones: page_entries.flatMap((entry) =>
      entry.kind === ChangeFeedEntryKind.TOMBSTONE ? [entry.row] : [],
    ),
    next_cursor: last_entry ? last_entry.sync_sequence : command.after_sequence,
    has_more: entries.length > command.page_size,
  };
}
