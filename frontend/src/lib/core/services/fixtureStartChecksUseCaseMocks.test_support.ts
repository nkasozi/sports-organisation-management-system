import type { FixtureLineup } from "../entities/FixtureLineup";
import type { PlayerTeamMembership } from "../entities/PlayerTeamMembership";
import type { CompetitionUseCases } from "../usecases/CompetitionUseCases";
import type { FixtureDetailsSetupUseCases } from "../usecases/FixtureDetailsSetupUseCases";
import type { FixtureLineupUseCases } from "../usecases/FixtureLineupUseCases";
import type { FixtureUseCases } from "../usecases/FixtureUseCases";
import type { OrganizationUseCases } from "../usecases/OrganizationUseCases";
import type { PlayerPositionUseCases } from "../usecases/PlayerPositionUseCases";
import type { PlayerTeamMembershipUseCases } from "../usecases/PlayerTeamMembershipUseCases";
import type { PlayerUseCases } from "../usecases/PlayerUseCases";
import type { SportUseCases } from "../usecases/SportUseCases";
import {
  create_test_player,
  type TestOfficialAssignment,
} from "./fixtureStartChecksEntities.test_support";

interface TestPage<TItem> {
  success: true;
  data: {
    items: TItem[];
    total_count: number;
    page_number: number;
    page_size: number;
    total_pages: number;
  };
}

function create_test_page<TItem>(items: TItem[]): TestPage<TItem> {
  return {
    success: true,
    data: {
      items,
      total_count: items.length,
      page_number: 1,
      page_size: 100,
      total_pages: 1,
    },
  };
}

export function create_mock_official_use_cases(
  officials: TestOfficialAssignment[],
): FixtureDetailsSetupUseCases {
  const setups =
    officials.length === 0
      ? []
      : [
          {
            id: `setup-${officials[0].fixture_id}`,
            fixture_id: officials[0].fixture_id,
            assigned_officials: officials.map((assignment) => ({
              official_id: assignment.official_id,
              role_id: assignment.role_id,
            })),
          },
        ];
  return {
    list_by_fixture: async () => create_test_page(setups),
  } as unknown as FixtureDetailsSetupUseCases;
}

export function create_mock_lineup_use_cases(
  lineups: FixtureLineup[],
): FixtureLineupUseCases {
  return {
    list: async () => create_test_page(lineups),
    create: async (input: Record<string, unknown>) => ({
      success: true,
      data: { ...input, id: "new-lineup-id" },
    }),
  } as unknown as FixtureLineupUseCases;
}

export function create_mock_membership_use_cases(
  memberships: PlayerTeamMembership[],
): PlayerTeamMembershipUseCases {
  return {
    list: async () => create_test_page(memberships),
  } as unknown as PlayerTeamMembershipUseCases;
}

export function create_mock_player_use_cases(
  memberships: PlayerTeamMembership[],
): PlayerUseCases {
  const players = memberships.map((m) => create_test_player(m.player_id));
  const player_by_id = new Map(players.map((p) => [String(p.id), p]));
  return {
    get_by_id: async (id: string) => {
      const player = player_by_id.get(id);
      return player
        ? { success: true, data: player }
        : { success: false, error: "Player not found" };
    },
    list: async () => create_test_page(players),
  } as unknown as PlayerUseCases;
}

export function create_mock_player_position_use_cases(): PlayerPositionUseCases {
  return {
    list: async () =>
      create_test_page([
        { id: "pos-1", name: "Forward", code: "FW" },
        { id: "pos-2", name: "Midfielder", code: "MF" },
        { id: "pos-3", name: "Defender", code: "DF" },
      ]),
  } as unknown as PlayerPositionUseCases;
}

export function create_mock_sport_use_cases(
  min_players: number,
  max_players: number,
): SportUseCases {
  return {
    get_by_id: async () => ({
      success: true,
      data: {
        id: "sport-1",
        name: "Test Sport",
        min_players_per_fixture: min_players,
        max_players_per_fixture: max_players,
      },
    }),
  } as unknown as SportUseCases;
}

export function create_mock_competition_use_cases(
  rule_overrides: Record<string, unknown> = {},
  squad_generation_strategy: string = "first_available",
): CompetitionUseCases {
  return {
    get_by_id: async () => ({
      success: true,
      data: {
        id: "comp-1",
        name: "Test Competition",
        organization_id: "org-1",
        rule_overrides,
        squad_generation_strategy,
      },
    }),
  } as unknown as CompetitionUseCases;
}

export function create_mock_fixture_use_cases(
  fixtures: Record<string, unknown>[] = [],
): FixtureUseCases {
  return {
    list: async () => create_test_page(fixtures),
  } as unknown as FixtureUseCases;
}

export function create_mock_organization_use_cases(
  sport_id: string = "sport-1",
): OrganizationUseCases {
  return {
    get_by_id: async () => ({
      success: true,
      data: {
        id: "org-1",
        name: "Test Organization",
        sport_id,
      },
    }),
  } as unknown as OrganizationUseCases;
}
