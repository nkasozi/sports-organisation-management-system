import type { QueryCtx } from "../_generated/server";
import type { SystemUserRecord } from "./auth_middleware";
import { read_string_or } from "./value_guards";

export const OwnershipRoleKind = {
  ADMINISTRATOR: "administrator",
  OFFICIALS_MANAGER: "officials_manager",
  TEAM_MANAGER: "team_manager",
  OFFICIAL: "official",
  PLAYER: "player",
  VIEWER: "viewer",
} as const;

export type OwnershipRoleKindValue =
  (typeof OwnershipRoleKind)[keyof typeof OwnershipRoleKind];

export interface CallerOwnership {
  role_kind: OwnershipRoleKindValue;
  user_ids: ReadonlySet<string>;
  team_ids: ReadonlySet<string>;
  player_ids: ReadonlySet<string>;
  official_ids: ReadonlySet<string>;
  team_staff_ids: ReadonlySet<string>;
  player_profile_ids: ReadonlySet<string>;
  team_profile_ids: ReadonlySet<string>;
}

type OwnershipRows = Promise<Array<Record<string, unknown>>>;

interface OwnershipRowLoader {
  load_team_memberships(team_id: string): OwnershipRows;
  load_team_staff(team_id: string): OwnershipRows;
  load_team_profiles(team_id: string): OwnershipRows;
  load_player_profiles(player_id: string): OwnershipRows;
}

const ROLE_KIND_BY_ROLE: Readonly<Record<string, OwnershipRoleKindValue>> = {
  super_admin: OwnershipRoleKind.ADMINISTRATOR,
  org_admin: OwnershipRoleKind.ADMINISTRATOR,
  officials_manager: OwnershipRoleKind.OFFICIALS_MANAGER,
  team_manager: OwnershipRoleKind.TEAM_MANAGER,
  official: OwnershipRoleKind.OFFICIAL,
  player: OwnershipRoleKind.PLAYER,
};
const ENDED_MEMBERSHIP_STATUSES = new Set(["inactive", "ended"]);
const EMPTY_VALUE = "";

export function resolve_ownership_role_kind(
  role: string,
): OwnershipRoleKindValue {
  return Object.prototype.hasOwnProperty.call(ROLE_KIND_BY_ROLE, role)
    ? ROLE_KIND_BY_ROLE[role]
    : OwnershipRoleKind.VIEWER;
}

function to_id_set(values: unknown[]): ReadonlySet<string> {
  return new Set(
    values
      .map((value) => read_string_or(value, EMPTY_VALUE).trim())
      .filter((value) => value.length > 0),
  );
}

function read_field_values(
  rows: Array<Record<string, unknown>>,
  field_name: string,
): unknown[] {
  return rows.map((row) => row[field_name]);
}

export function create_database_ownership_loader(ctx: {
  db: QueryCtx["db"];
}): OwnershipRowLoader {
  return {
    load_team_memberships: (team_id) =>
      ctx.db
        .query("player_team_memberships")
        .withIndex("by_team", (range) => range.eq("team_id", team_id))
        .collect(),
    load_team_staff: (team_id) =>
      ctx.db
        .query("team_staff")
        .withIndex("by_team", (range) => range.eq("team_id", team_id))
        .collect(),
    load_team_profiles: (team_id) =>
      ctx.db
        .query("team_profiles")
        .withIndex("by_team", (range) => range.eq("team_id", team_id))
        .collect(),
    load_player_profiles: (player_id) =>
      ctx.db
        .query("player_profiles")
        .withIndex("by_player", (range) => range.eq("player_id", player_id))
        .collect(),
  };
}

async function load_team_rows(
  loader: OwnershipRowLoader,
  team_id: string,
): Promise<Partial<CallerOwnership>> {
  if (!team_id) return {};
  const memberships = (await loader.load_team_memberships(team_id)).filter(
    (row) =>
      !ENDED_MEMBERSHIP_STATUSES.has(read_string_or(row.status, EMPTY_VALUE)),
  );
  const staff = await loader.load_team_staff(team_id);
  const team_profiles = await loader.load_team_profiles(team_id);
  return {
    team_ids: to_id_set([team_id]),
    player_ids: to_id_set(read_field_values(memberships, "player_id")),
    team_staff_ids: to_id_set(read_field_values(staff, "local_id")),
    team_profile_ids: to_id_set(read_field_values(team_profiles, "local_id")),
  };
}

async function load_player_profile_ids(
  loader: OwnershipRowLoader,
  player_ids: ReadonlySet<string>,
): Promise<ReadonlySet<string>> {
  const profile_ids: unknown[] = [];
  for (const player_id of player_ids) {
    const profiles = await loader.load_player_profiles(player_id);
    profile_ids.push(...read_field_values(profiles, "local_id"));
  }
  return to_id_set(profile_ids);
}

function build_empty_ownership(caller: SystemUserRecord): CallerOwnership {
  return {
    role_kind: resolve_ownership_role_kind(caller.role),
    user_ids: to_id_set([caller.local_id, String(caller._id)]),
    team_ids: new Set(),
    player_ids: new Set(),
    official_ids: new Set(),
    team_staff_ids: new Set(),
    player_profile_ids: new Set(),
    team_profile_ids: new Set(),
  };
}

async function load_role_ownership(
  loader: OwnershipRowLoader,
  caller: SystemUserRecord,
  ownership: CallerOwnership,
): Promise<CallerOwnership> {
  switch (ownership.role_kind) {
    case OwnershipRoleKind.TEAM_MANAGER:
      return {
        ...ownership,
        ...(await load_team_rows(loader, read_string_or(caller.team_id, ""))),
      };
    case OwnershipRoleKind.PLAYER:
      return {
        ...ownership,
        player_ids: to_id_set([caller.player_id]),
      };
    case OwnershipRoleKind.OFFICIAL:
      return { ...ownership, official_ids: to_id_set([caller.official_id]) };
    case OwnershipRoleKind.ADMINISTRATOR:
    case OwnershipRoleKind.OFFICIALS_MANAGER:
    case OwnershipRoleKind.VIEWER:
      return ownership;
  }
}

export async function load_caller_ownership(
  loader: OwnershipRowLoader,
  caller: SystemUserRecord,
): Promise<CallerOwnership> {
  const ownership = await load_role_ownership(
    loader,
    caller,
    build_empty_ownership(caller),
  );
  if (ownership.player_ids.size === 0) return ownership;
  return {
    ...ownership,
    player_profile_ids: await load_player_profile_ids(
      loader,
      ownership.player_ids,
    ),
  };
}
