import type { QueryCtx } from "../_generated/server";
import {
  can_correct_started_lineup,
  has_post_kickoff_lineup_permission,
  LINEUP_FIXTURE_STATUS,
} from "../shared_lineup_permissions";
import { OptionStatus } from "./option";
import type { SyncWriteCommand } from "./sync_write_guard";
import { is_object_record, is_string } from "./value_guards";

const LINEUP_TABLE = "fixture_lineups";
const PLAYER_TIME_FIELDS = new Set(["time_on", "time_off"]);

function without_player_times(player: unknown): string {
  if (!is_object_record(player)) return JSON.stringify(player);
  return JSON.stringify(
    Object.keys(player)
      .filter((key) => !PLAYER_TIME_FIELDS.has(key))
      .sort()
      .map((key) => [key, player[key]]),
  );
}

function is_live_times_update(
  previous: Record<string, unknown>,
  incoming: Record<string, unknown>,
): boolean {
  if (
    !Array.isArray(previous.selected_players) ||
    !Array.isArray(incoming.selected_players)
  )
    return false;
  const before = previous.selected_players.map(without_player_times).sort();
  const after = incoming.selected_players.map(without_player_times).sort();
  const mutable_fields = new Set([
    "selected_players",
    "updated_at",
    "version",
    "synced_at",
  ]);
  return (
    before.length === after.length &&
    before.every((player, index) => player === after[index]) &&
    Object.keys(incoming).every(
      (key) =>
        mutable_fields.has(key) ||
        JSON.stringify(previous[key]) === JSON.stringify(incoming[key]),
    )
  );
}

async function is_valid_lineup_parent(
  ctx: { db: QueryCtx["db"] },
  fixture: {
    organization_id?: string;
    home_team_id?: string;
    away_team_id?: string;
  },
  fixture_id: string,
  lineup: Record<string, unknown>,
  is_new: boolean,
): Promise<boolean> {
  if (lineup.organization_id !== fixture.organization_id) return false;
  if (
    lineup.team_id !== fixture.home_team_id &&
    lineup.team_id !== fixture.away_team_id
  )
    return false;
  if (!is_new) return true;
  if (!is_string(lineup.team_id)) return false;
  const team_id = lineup.team_id;
  const existing = await ctx.db
    .query(LINEUP_TABLE)
    .withIndex("by_fixture_team", (range) =>
      range.eq("fixture_id", fixture_id).eq("team_id", team_id),
    )
    .first();
  return !existing;
}

function changes_lineup_parent(
  previous: Record<string, unknown> | undefined,
  incoming: Record<string, unknown> | undefined,
): boolean {
  if (!previous || !incoming) return false;
  return (
    (incoming.fixture_id !== undefined &&
      incoming.fixture_id !== previous.fixture_id) ||
    (incoming.team_id !== undefined && incoming.team_id !== previous.team_id)
  );
}

export async function permits_lineup_write_for_fixture(
  ctx: { db: QueryCtx["db"] },
  command: SyncWriteCommand,
): Promise<boolean> {
  if (command.table_name !== LINEUP_TABLE) return true;
  const previous =
    command.existing_record.status === OptionStatus.SOME
      ? command.existing_record.value
      : undefined;
  const incoming =
    command.incoming_record.status === OptionStatus.SOME
      ? command.incoming_record.value
      : undefined;
  const fixture_id = previous?.fixture_id ?? incoming?.fixture_id;
  if (!is_string(fixture_id)) return false;
  if (changes_lineup_parent(previous, incoming)) return false;
  const fixture = await ctx.db
    .query("fixtures")
    .withIndex("by_local_id", (range) => range.eq("local_id", fixture_id))
    .first();
  if (!fixture) return false;
  if (
    !(await is_valid_lineup_parent(
      ctx,
      fixture,
      fixture_id,
      { ...previous, ...incoming },
      !previous,
    ))
  )
    return false;
  return permits_lineup_status_write(
    fixture.status,
    previous,
    incoming,
    has_post_kickoff_lineup_permission(command.caller.role),
  );
}

function permits_lineup_status_write(
  status: string | undefined,
  previous: Record<string, unknown> | undefined,
  incoming: Record<string, unknown> | undefined,
  has_permission: boolean,
): boolean {
  if (status === LINEUP_FIXTURE_STATUS.SCHEDULED) return true;
  if (!incoming) return false;
  if (can_correct_started_lineup(status, has_permission)) return true;
  return (
    status === LINEUP_FIXTURE_STATUS.IN_PROGRESS &&
    !!previous &&
    is_live_times_update(previous, incoming)
  );
}
