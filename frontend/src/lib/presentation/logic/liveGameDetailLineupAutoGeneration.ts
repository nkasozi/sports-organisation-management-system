import type { Fixture } from "$lib/core/entities/Fixture";
import type { CreateFixtureLineupInput } from "$lib/core/entities/FixtureLineup";
import type { Player } from "$lib/core/entities/Player";
import type {
  get_fixture_lineup_use_cases,
  get_player_team_membership_use_cases,
  get_player_use_cases,
} from "$lib/infrastructure/registry/useCaseFactories";

export type FixtureLineupUseCases = ReturnType<
  typeof get_fixture_lineup_use_cases
>;
export type PlayerMembershipUseCases = ReturnType<
  typeof get_player_team_membership_use_cases
>;
export type PlayerUseCases = ReturnType<typeof get_player_use_cases>;

type ActiveMembership = {
  player_id: string;
  status: string;
  jersey_number?: number;
};

const ACTIVE_MEMBERSHIP_STATUS = "active";
const AUTO_GENERATED_SUBMITTER = "auto-generated";
const LINEUP_AUTO_GENERATION_MEMBERSHIPS_FAILED_EVENT =
  "live_game_lineup_auto_generation_memberships_failed";
const AUTO_GENERATED_NOTES = "Auto-generated lineup at game start";
const UNKNOWN_FIRST_NAME = "Unknown";
const UNKNOWN_LAST_NAME = "Player";

async function list_active_memberships(
  team_id: string,
  player_membership_use_cases: PlayerMembershipUseCases,
): Promise<ActiveMembership[]> {
  const memberships_result = await player_membership_use_cases.list({
    team_id,
    status: ACTIVE_MEMBERSHIP_STATUS,
  });
  if (!memberships_result.success) {
    console.error("[LiveGameDetail] Failed to list team memberships", {
      event: LINEUP_AUTO_GENERATION_MEMBERSHIPS_FAILED_EVENT,
      team_id,
      error: memberships_result.error,
    });
    return [];
  }
  return memberships_result.data.items.filter(
    (membership: { status: string }) =>
      membership.status === ACTIVE_MEMBERSHIP_STATUS,
  ) as ActiveMembership[];
}

async function load_membership_players(
  active_memberships: ActiveMembership[],
  player_use_cases: PlayerUseCases,
): Promise<Player[]> {
  const player_results = await Promise.all(
    active_memberships.map((membership) =>
      player_use_cases.get_by_id(membership.player_id),
    ),
  );
  return player_results.reduce<Player[]>((loaded_players, result) => {
    if (!result.success) return loaded_players;
    loaded_players.push(result.data);
    return loaded_players;
  }, []);
}

function build_selected_players(
  active_memberships: ActiveMembership[],
  players: Player[],
): CreateFixtureLineupInput["selected_players"] {
  return active_memberships.map((membership) => {
    const player = players.find(
      (current_player) => current_player?.id === membership.player_id,
    );
    return {
      id: membership.player_id,
      first_name: player?.first_name || UNKNOWN_FIRST_NAME,
      last_name: player?.last_name || UNKNOWN_LAST_NAME,
      jersey_number: membership.jersey_number ?? 0,
      position: "",
      is_captain: false,
      is_substitute: false,
    };
  }) as CreateFixtureLineupInput["selected_players"];
}

export async function auto_generate_live_game_lineup(
  fixture: Fixture,
  team_id: string,
  player_membership_use_cases: PlayerMembershipUseCases,
  player_use_cases: PlayerUseCases,
  fixture_lineup_use_cases: FixtureLineupUseCases,
): Promise<boolean> {
  const active_memberships = await list_active_memberships(
    team_id,
    player_membership_use_cases,
  );
  if (active_memberships.length === 0) return false;
  const players = await load_membership_players(
    active_memberships,
    player_use_cases,
  );
  const lineup_input: CreateFixtureLineupInput = {
    organization_id: fixture.organization_id,
    fixture_id: fixture.id,
    team_id,
    selected_players: build_selected_players(active_memberships, players),
    status: "submitted",
    submitted_by: AUTO_GENERATED_SUBMITTER,
    submitted_at: new Date().toISOString(),
    notes: AUTO_GENERATED_NOTES,
  };
  const create_result = await fixture_lineup_use_cases.create(lineup_input);
  return create_result.success;
}
