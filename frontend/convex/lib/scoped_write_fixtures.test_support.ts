import { batch_upsert } from "../sync_batch_mutation";
import {
  authenticated_identity,
  create_fake_convex_context,
  type FakeConvexContext,
  find_table_rows,
  invoke_convex_handler,
} from "./fake_convex_context.test_support";
import {
  ALL_FIXTURE_USERS,
  build_player_record,
  build_team_record,
  ORGANIZATION_A_ID,
  ORGANIZATION_A_PLAYER_EMAIL,
} from "./security_test_fixtures.test_support";

export const MANAGER_EMAIL = "manager.a@example.com";
export const OFFICIAL_EMAIL = "official.a@example.com";
export const KNOWN_V1 = { kind: "known", version: 1 };
export const UNKNOWN = { kind: "unknown" };

export interface BatchResult {
  success: boolean;
  results: Array<{ local_id: string; success: boolean; action: string }>;
}

const USERS = [
  ...ALL_FIXTURE_USERS.map((user) => {
    if (user.email === ORGANIZATION_A_PLAYER_EMAIL)
      return { ...user, player_id: "player_a" };
    if (user.email === MANAGER_EMAIL) return { ...user, team_id: "team_a" };
    return user;
  }),
  {
    ...ALL_FIXTURE_USERS[1],
    local_id: "user_official_a",
    email: OFFICIAL_EMAIL,
    role: "official",
  },
];

export function create_scoped_write_context(email: string): FakeConvexContext {
  return create_fake_convex_context({
    identity: authenticated_identity(email),
    tables: {
      system_users: USERS,
      teams: [
        build_team_record("team_a", ORGANIZATION_A_ID, 1),
        build_team_record("team_a2", ORGANIZATION_A_ID, 1),
      ],
      players: [
        build_player_record("player_a", ORGANIZATION_A_ID),
        build_player_record("player_a2", ORGANIZATION_A_ID),
      ],
      player_team_memberships: [
        {
          local_id: "m1",
          organization_id: ORGANIZATION_A_ID,
          team_id: "team_a",
          player_id: "player_a",
          status: "active",
        },
      ],
      identifications: [
        {
          local_id: "id_a",
          holder_type: "player",
          holder_id: "player_a",
          is_verified: false,
          version: 1,
        },
        {
          local_id: "id_a2",
          holder_type: "player",
          holder_id: "player_a2",
          is_verified: false,
          version: 1,
        },
      ],
      fixtures: [
        {
          local_id: "fixture_a",
          organization_id: ORGANIZATION_A_ID,
          notes: "x",
          version: 1,
        },
      ],
    },
  });
}

export async function upsert_one(
  email: string,
  table_name: string,
  record: {
    local_id: string;
    data: Record<string, unknown>;
    base_version: unknown;
  },
): Promise<{
  context: FakeConvexContext;
  outcome: BatchResult["results"][number];
}> {
  const context = create_scoped_write_context(email);
  const result = await invoke_convex_handler<BatchResult>(
    batch_upsert,
    context,
    {
      table_name,
      records: [{ ...record, version: 1 }],
    },
  );
  return {
    context,
    outcome: result.results[0] ?? {
      local_id: "",
      success: false,
      action: "batch_rejected",
    },
  };
}

export function find_rows(
  context: FakeConvexContext,
  table_name: string,
  local_id: string,
): Array<Record<string, unknown>> {
  return find_table_rows(context, table_name).filter(
    (row) => row.local_id === local_id,
  );
}
