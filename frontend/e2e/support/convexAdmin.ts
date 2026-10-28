import { execFileSync } from "node:child_process";

import { expect } from "@playwright/test";

import type { E2eProfile } from "./profiles";

const SERVER_SYNC_TIMEOUT_MS = 90_000;
const TEXT_TYPE = "string";
const SERVER_POLL_INTERVALS_MS = [1_000, 2_000, 3_000, 5_000];

function run_convex_function<T>(
  function_name: string,
  function_arguments: Record<string, unknown>,
): T {
  const output = execFileSync(
    "npx",
    ["convex", "run", function_name, JSON.stringify(function_arguments)],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  return JSON.parse(output) as T;
}

interface E2eProfileLinks {
  organization_id: string;
  team_id?: string;
  official_id?: string;
  player_id?: string;
}

export function register_profile(
  profile: E2eProfile,
  links: E2eProfileLinks,
): void {
  const result = run_convex_function<{ success: boolean; error?: string }>(
    "e2e_profiles:register_e2e_profile",
    {
      email: profile.email,
      first_name: profile.first_name,
      last_name: profile.last_name,
      role: profile.app_role,
      ...links,
    },
  );
  expect(result.success, `register ${profile.key}: ${result.error}`).toBe(true);
}

export type ServerRecord = Record<string, unknown> & { local_id: string };

type ServerTable =
  | "sports"
  | "organizations"
  | "teams"
  | "officials"
  | "players"
  | "competitions"
  | "venues"
  | "fixtures"
  | "fixture_details_setups"
  | "fixture_lineups"
  | "player_team_memberships"
  | "competition_teams"
  | "system_users"
  | "audit_logs";

export function list_server_records(
  table: ServerTable,
  organization_id?: string,
): ServerRecord[] {
  return run_convex_function<ServerRecord[]>("e2e_profiles:list_e2e_records", {
    table,
    ...(organization_id ? { organization_id } : {}),
  });
}

export function is_text(value: unknown): value is string {
  return typeof value === TEXT_TYPE;
}

function record_label(record: ServerRecord): string {
  if (is_text(record.name)) return record.name;
  return `${String(record.first_name ?? "")} ${String(record.last_name ?? "")}`.trim();
}

export function find_server_record(
  table: ServerTable,
  label: string,
  organization_id?: string,
): ServerRecord | undefined {
  return list_server_records(table, organization_id).find(
    (record) => record_label(record) === label,
  );
}

export async function wait_for_server_record(
  table: ServerTable,
  matches: (record: ServerRecord) => boolean,
  description: string,
): Promise<ServerRecord> {
  let found: ServerRecord | undefined;
  await expect
    .poll(
      () => {
        found = list_server_records(table).find(matches);
        return Boolean(found);
      },
      {
        message: `waiting for the server to store ${description}`,
        timeout: SERVER_SYNC_TIMEOUT_MS,
        intervals: SERVER_POLL_INTERVALS_MS,
      },
    )
    .toBe(true);
  return found as ServerRecord;
}

export function wait_for_named_record(
  table: ServerTable,
  label: string,
): Promise<ServerRecord> {
  return wait_for_server_record(
    table,
    (record) => record_label(record) === label,
    `${table} "${label}"`,
  );
}

export function reset_games(organization_name: string): void {
  run_convex_function("e2e_profiles:reset_e2e_games", { organization_name });
}
