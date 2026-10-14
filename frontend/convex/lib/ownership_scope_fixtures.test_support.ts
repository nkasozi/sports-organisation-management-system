import { batch_upsert } from "../sync_batch_mutation";
import { get_changes_page } from "../sync_change_queries";
import {
  authenticated_identity,
  create_fake_convex_context,
  type FakeConvexContext,
  invoke_convex_handler,
  with_identity,
} from "./fake_convex_context.test_support";
import { MANAGER_EMAIL } from "./scoped_write_fixtures.test_support";
import {
  ALL_FIXTURE_USERS,
  build_player_record,
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_ID,
} from "./security_test_fixtures.test_support";

type StoredRecord = Record<string, unknown>;

interface ChangePage {
  records: StoredRecord[];
  tombstones: Array<{ local_id: string; version: number }>;
}

const SYNCED_AT = "2024-01-01T00:00:00.000Z";
const SEQUENCED_TABLES = [
  "players",
  "identifications",
  "player_team_memberships",
  "system_users",
];
const USERS = ALL_FIXTURE_USERS.map((user, index) =>
  user.email === MANAGER_EMAIL
    ? { ...user, team_id: "team_a", sync_sequence: index + 1 }
    : { ...user, sync_sequence: index + 1 },
);

function sequenced(record: StoredRecord, sync_sequence: number): StoredRecord {
  return { ...record, sync_sequence, version: 1, synced_at: SYNCED_AT };
}

export function create_context(): FakeConvexContext {
  return create_fake_convex_context({
    identity: authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL),
    tables: {
      system_users: USERS,
      teams: [
        { local_id: "team_a", organization_id: ORGANIZATION_A_ID },
        { local_id: "team_a2", organization_id: ORGANIZATION_A_ID },
      ],
      players: [
        sequenced(build_player_record("player_a", ORGANIZATION_A_ID), 1),
        sequenced(build_player_record("player_a2", ORGANIZATION_A_ID), 2),
      ],
      player_team_memberships: [
        sequenced(
          {
            local_id: "m1",
            organization_id: ORGANIZATION_A_ID,
            team_id: "team_a",
            player_id: "player_a",
            status: "active",
          },
          1,
        ),
      ],
      identifications: [
        sequenced(
          { local_id: "id_a", holder_type: "player", holder_id: "player_a" },
          1,
        ),
        sequenced(
          { local_id: "id_a2", holder_type: "player", holder_id: "player_a2" },
          2,
        ),
      ],
      sync_change_sequences: SEQUENCED_TABLES.map((table_name) => ({
        table_name,
        last_sequence: USERS.length,
      })),
      sync_sequence_backfill_states: SEQUENCED_TABLES.map((table_name) => ({
        table_name,
        status: "complete",
        backfilled_count: 0,
        updated_at: SYNCED_AT,
      })),
    },
  });
}

export async function upsert_as_admin(
  context: FakeConvexContext,
  table_name: string,
  record: { local_id: string; data: StoredRecord; base_version: unknown },
): Promise<string> {
  const result = await invoke_convex_handler<{
    results: Array<{ action: string }>;
  }>(batch_upsert, context, {
    table_name,
    records: [{ ...record, version: 1 }],
  });
  return result.results[0].action;
}

export async function read_changes(
  context: FakeConvexContext,
  email: string,
  table_name: string,
): Promise<ChangePage> {
  return invoke_convex_handler<ChangePage>(
    get_changes_page,
    with_identity(context, authenticated_identity(email)),
    { table_name, after_sequence: USERS.length },
  );
}

export function find_record(page: ChangePage, local_id: string): StoredRecord {
  return page.records.find((record) => record.local_id === local_id) ?? {};
}

export function tombstone_ids(page: ChangePage): string[] {
  return page.tombstones.map((tombstone) => tombstone.local_id);
}
