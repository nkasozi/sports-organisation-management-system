import type { Result } from "../../core/types/Result";
import {
  create_seed_competition_teams,
  create_seed_fixture_lineups,
  create_seed_fixtures,
  create_seed_jersey_colors,
  create_seed_player_team_memberships,
} from "../../infrastructure/utils/SeedDataGenerator";
import type { InBrowserCompetitionTeamRepository } from "../repositories/InBrowserCompetitionTeamRepository";
import type { InBrowserFixtureLineupRepository } from "../repositories/InBrowserFixtureLineupRepository";
import type { InBrowserFixtureRepository } from "../repositories/InBrowserFixtureRepository";
import type { InBrowserJerseyColorRepository } from "../repositories/InBrowserJerseyColorRepository";
import type { InBrowserPlayerTeamMembershipRepository } from "../repositories/InBrowserPlayerTeamMembershipRepository";
import { seed_demo_entity_batch } from "./demoEntityBatchSeeder";
import type { SeedEntityIdLookups } from "./seedingTypes";

export async function seed_demo_competition_teams(
  competition_team_repository: InBrowserCompetitionTeamRepository,
): Promise<Result<number>> {
  return seed_demo_entity_batch({
    plural_label: "competition teams",
    entity_type: "competition_team",
    entities: create_seed_competition_teams(),
    seed: (teams) => competition_team_repository.seed_with_data(teams),
    describe_entity: (ct) =>
      `Team ${ct.team_id} in Competition ${ct.competition_id}`,
  });
}

export async function seed_demo_player_memberships(
  player_membership_repository: InBrowserPlayerTeamMembershipRepository,
): Promise<Result<number>> {
  return seed_demo_entity_batch({
    plural_label: "player memberships",
    entity_type: "player_team_membership",
    entities: create_seed_player_team_memberships(),
    seed: (memberships) =>
      player_membership_repository.seed_with_data(memberships),
    describe_entity: (m) => `Player ${m.player_id} -> Team ${m.team_id}`,
  });
}

export async function seed_demo_fixtures(
  fixture_repository: InBrowserFixtureRepository,
  entity_id_lookups: SeedEntityIdLookups,
): Promise<Result<number>> {
  return seed_demo_entity_batch({
    plural_label: "fixtures",
    entity_type: "fixture",
    entities: create_seed_fixtures(
      entity_id_lookups.referee_role_id,
      entity_id_lookups.assistant_referee_role_id,
    ),
    seed: (fixtures) => fixture_repository.seed_with_data(fixtures),
    describe_entity: (f) => `${f.venue} - Round ${f.round_number}`,
  });
}

export async function seed_demo_fixture_lineups(
  fixture_lineup_repository: InBrowserFixtureLineupRepository,
): Promise<Result<number>> {
  return seed_demo_entity_batch({
    plural_label: "fixture lineups",
    entity_type: "fixture_lineup",
    entities: create_seed_fixture_lineups(),
    seed: (lineups) => fixture_lineup_repository.seed_with_data(lineups),
    describe_entity: (l) =>
      `Lineup for fixture ${l.fixture_id} - Team ${l.team_id}`,
  });
}

export async function seed_demo_jersey_colors(
  jersey_color_repository: InBrowserJerseyColorRepository,
): Promise<Result<number>> {
  return seed_demo_entity_batch({
    plural_label: "jersey colors",
    entity_type: "jersey_color",
    entities: create_seed_jersey_colors(),
    seed: (colors) => jersey_color_repository.seed_with_data(colors),
    describe_entity: (j) => `${j.nickname} (${j.main_color})`,
  });
}
