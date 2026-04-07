import type { Result } from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
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
import type { SeedEntityIdLookups } from "./seedingTypes";
import { emit_entity_created_events } from "./seedingUserSetup";

export async function seed_demo_competition_teams(
  competition_team_repository: InBrowserCompetitionTeamRepository,
): Promise<Result<number>> {
  console.log("[Seeding] Seeding demo competition teams");
  const seed_competition_teams = create_seed_competition_teams();
  const result = await competition_team_repository.seed_with_data(
    seed_competition_teams,
  );
  if (!result.success) {
    console.error(`[Seeding] Competition team seeding failed: ${result.error}`);
    return create_failure_result(
      `Competition team seeding failed: ${result.error}`,
    );
  }
  emit_entity_created_events(
    "competition_team",
    seed_competition_teams,
    (ct) => `Team ${ct.team_id} in Competition ${ct.competition_id}`,
  );
  console.log(
    `[Seeding] Seeded ${seed_competition_teams.length} competition teams`,
  );
  return create_success_result(seed_competition_teams.length);
}

export async function seed_demo_player_memberships(
  player_membership_repository: InBrowserPlayerTeamMembershipRepository,
): Promise<Result<number>> {
  console.log("[Seeding] Seeding demo player memberships");
  const seed_memberships = create_seed_player_team_memberships();
  const result =
    await player_membership_repository.seed_with_data(seed_memberships);
  if (!result.success) {
    console.error(
      `[Seeding] Player membership seeding failed: ${result.error}`,
    );
    return create_failure_result(
      `Player membership seeding failed: ${result.error}`,
    );
  }
  emit_entity_created_events(
    "player_team_membership",
    seed_memberships,
    (m) => `Player ${m.player_id} -> Team ${m.team_id}`,
  );
  console.log(`[Seeding] Seeded ${seed_memberships.length} player memberships`);
  return create_success_result(seed_memberships.length);
}

export async function seed_demo_fixtures(
  fixture_repository: InBrowserFixtureRepository,
  entity_id_lookups: SeedEntityIdLookups,
): Promise<Result<number>> {
  console.log("[Seeding] Seeding demo fixtures");
  const seed_fixtures = create_seed_fixtures(
    entity_id_lookups.referee_role_id,
    entity_id_lookups.assistant_referee_role_id,
  );
  const result = await fixture_repository.seed_with_data(seed_fixtures);
  if (!result.success) {
    console.error(`[Seeding] Fixture seeding failed: ${result.error}`);
    return create_failure_result(`Fixture seeding failed: ${result.error}`);
  }
  emit_entity_created_events(
    "fixture",
    seed_fixtures,
    (f) => `${f.venue} - Round ${f.round_number}`,
  );
  console.log(`[Seeding] Seeded ${seed_fixtures.length} fixtures`);
  return create_success_result(seed_fixtures.length);
}

export async function seed_demo_fixture_lineups(
  fixture_lineup_repository: InBrowserFixtureLineupRepository,
): Promise<Result<number>> {
  console.log("[Seeding] Seeding demo fixture lineups");
  const seed_lineups = create_seed_fixture_lineups();
  const result = await fixture_lineup_repository.seed_with_data(seed_lineups);
  if (!result.success) {
    console.error(`[Seeding] Fixture lineup seeding failed: ${result.error}`);
    return create_failure_result(
      `Fixture lineup seeding failed: ${result.error}`,
    );
  }
  emit_entity_created_events(
    "fixture_lineup",
    seed_lineups,
    (l) => `Lineup for fixture ${l.fixture_id} - Team ${l.team_id}`,
  );
  console.log(`[Seeding] Seeded ${seed_lineups.length} fixture lineups`);
  return create_success_result(seed_lineups.length);
}

export async function seed_demo_jersey_colors(
  jersey_color_repository: InBrowserJerseyColorRepository,
): Promise<Result<number>> {
  console.log("[Seeding] Seeding demo jersey colors");
  const seed_jersey_colors = create_seed_jersey_colors();
  const result =
    await jersey_color_repository.seed_with_data(seed_jersey_colors);
  if (!result.success) {
    console.error(`[Seeding] Jersey color seeding failed: ${result.error}`);
    return create_failure_result(
      `Jersey color seeding failed: ${result.error}`,
    );
  }
  emit_entity_created_events(
    "jersey_color",
    seed_jersey_colors,
    (j) => `${j.nickname} (${j.main_color})`,
  );
  console.log(`[Seeding] Seeded ${seed_jersey_colors.length} jersey colors`);
  return create_success_result(seed_jersey_colors.length);
}
