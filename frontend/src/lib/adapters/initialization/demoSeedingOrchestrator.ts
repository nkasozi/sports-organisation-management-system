import type { Organization } from "../../core/entities/Organization";
import type { ScalarValueInput } from "../../core/types/DomainScalars";
import type { Result } from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import {
  seed_demo_competition_stages,
  seed_demo_competitions,
  seed_demo_officials,
  seed_demo_players,
  seed_demo_team_staff,
  seed_demo_teams,
  seed_demo_venues,
} from "./demoEntitySeedersCore";
import {
  seed_demo_competition_teams,
  seed_demo_fixture_lineups,
  seed_demo_fixtures,
  seed_demo_jersey_colors,
  seed_demo_player_memberships,
} from "./demoEntitySeedersExtended";
import {
  seed_demo_player_profiles,
  seed_demo_profile_links,
  seed_demo_team_profiles,
} from "./demoEntitySeedersProfiles";
import type { DemoSeedingRepos } from "./demoSeedingRepos";
import type { SeedEntityIdLookups, SeedVenueIds } from "./seedingTypes";

type DemoSeedStep = () => Promise<Result<unknown>>;

async function run_demo_seed_steps(
  steps: DemoSeedStep[],
): Promise<Result<boolean>> {
  for (const step of steps) {
    const step_result = await step();
    if (!step_result.success) return create_failure_result(step_result.error);
  }
  return create_success_result(true);
}

function build_steps_after_venues(
  entity_id_lookups: SeedEntityIdLookups,
  repos: DemoSeedingRepos,
  organization_id: ScalarValueInput<Organization["id"]>,
  venue_ids: SeedVenueIds,
): DemoSeedStep[] {
  return [
    () => seed_demo_teams(repos.team, venue_ids),
    () => seed_demo_team_staff(repos.team_staff, entity_id_lookups),
    () => seed_demo_officials(organization_id, repos.official),
    () => seed_demo_competitions(repos.competition, entity_id_lookups),
    () => seed_demo_competition_stages(repos.competition_stage),
    () => seed_demo_competition_teams(repos.competition_team),
    () => seed_demo_player_memberships(repos.player_membership),
    () => seed_demo_fixtures(repos.fixture, entity_id_lookups),
    () => seed_demo_fixture_lineups(repos.fixture_lineup),
    () => seed_demo_jersey_colors(repos.jersey_color),
    () => seed_demo_player_profiles(repos.player_profile),
    () => seed_demo_team_profiles(repos.team_profile),
    () => seed_demo_profile_links(repos.profile_link),
  ];
}

export async function seed_all_demo_entities(
  organization_id: ScalarValueInput<Organization["id"]>,
  entity_id_lookups: SeedEntityIdLookups,
  repos: DemoSeedingRepos,
): Promise<Result<boolean>> {
  const players_result = await seed_demo_players(
    organization_id,
    repos.player,
    entity_id_lookups.position_ids,
  );
  if (!players_result.success)
    return create_failure_result(players_result.error);
  const venues_result = await seed_demo_venues(organization_id, repos.venue);
  if (!venues_result.success) return create_failure_result(venues_result.error);
  return run_demo_seed_steps(
    build_steps_after_venues(
      entity_id_lookups,
      repos,
      organization_id,
      venues_result.data,
    ),
  );
}
