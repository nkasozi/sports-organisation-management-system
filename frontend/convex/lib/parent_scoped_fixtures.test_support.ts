import {
  ORGANIZATION_A_ID,
  ORGANIZATION_B_ID,
} from "./security_test_fixtures.test_support";

const SYNCED_AT = "2024-01-01T00:00:00.000Z";

function sync_row(
  local_id: string,
  fields: Record<string, unknown>,
): Record<string, unknown> {
  return { local_id, synced_at: SYNCED_AT, version: 1, ...fields };
}

export const PARENT_TABLE_ROWS: Record<
  string,
  Array<Record<string, unknown>>
> = {
  competitions: [
    sync_row("competition_a", {
      name: "League A",
      organization_id: ORGANIZATION_A_ID,
    }),
    sync_row("competition_b", {
      name: "League B",
      organization_id: ORGANIZATION_B_ID,
    }),
  ],
  players: [
    sync_row("player_a", {
      first_name: "A",
      last_name: "A",
      organization_id: ORGANIZATION_A_ID,
    }),
    sync_row("player_b", {
      first_name: "B",
      last_name: "B",
      organization_id: ORGANIZATION_B_ID,
    }),
  ],
  player_profiles: [
    sync_row("player_profile_a", { player_id: "player_a" }),
    sync_row("player_profile_b", { player_id: "player_b" }),
  ],
};

export const PARENT_SCOPED_ROWS: Record<
  string,
  Array<Record<string, unknown>>
> = {
  competition_stages: [
    sync_row("stage_a", {
      competition_id: "competition_a",
      name: "Pool A",
      stage_type: "group",
    }),
    sync_row("stage_b", {
      competition_id: "competition_b",
      name: "Pool B",
      stage_type: "group",
    }),
  ],
  identifications: [
    sync_row("identification_a", {
      holder_type: "player",
      holder_id: "player_a",
      identifier_value: "A-1",
    }),
    sync_row("identification_b", {
      holder_type: "player",
      holder_id: "player_b",
      identifier_value: "B-1",
    }),
  ],
  profile_links: [
    sync_row("link_a", {
      profile_id: "player_profile_a",
      platform: "x",
      url: "https://a.example.com",
    }),
    sync_row("link_b", {
      profile_id: "player_profile_b",
      platform: "x",
      url: "https://b.example.com",
    }),
  ],
};

export function build_stage(
  local_id: string,
  competition_id: string,
  version: number,
): Record<string, unknown> {
  return {
    ...sync_row(local_id, {
      competition_id,
      name: local_id,
      stage_type: "group",
    }),
    version,
  };
}
