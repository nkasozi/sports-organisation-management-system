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
import type { SeedEntityIdLookups } from "./seedingTypes";

export async function seed_all_demo_entities(
  organization_id: string,
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

  const teams_result = await seed_demo_teams(repos.team, venues_result.data);
  if (!teams_result.success) return create_failure_result(teams_result.error);

  const staff_result = await seed_demo_team_staff(
    repos.team_staff,
    entity_id_lookups,
  );
  if (!staff_result.success) return create_failure_result(staff_result.error);

  const officials_result = await seed_demo_officials(
    organization_id,
    repos.official,
  );
  if (!officials_result.success)
    return create_failure_result(officials_result.error);

  const competitions_result = await seed_demo_competitions(
    repos.competition,
    entity_id_lookups,
  );
  if (!competitions_result.success)
    return create_failure_result(competitions_result.error);

  const stages_result = await seed_demo_competition_stages(
    repos.competition_stage,
  );
  if (!stages_result.success) return create_failure_result(stages_result.error);

  const comp_teams_result = await seed_demo_competition_teams(
    repos.competition_team,
  );
  if (!comp_teams_result.success)
    return create_failure_result(comp_teams_result.error);

  const memberships_result = await seed_demo_player_memberships(
    repos.player_membership,
  );
  if (!memberships_result.success)
    return create_failure_result(memberships_result.error);

  const fixtures_result = await seed_demo_fixtures(
    repos.fixture,
    entity_id_lookups,
  );
  if (!fixtures_result.success)
    return create_failure_result(fixtures_result.error);

  const lineups_result = await seed_demo_fixture_lineups(repos.fixture_lineup);
  if (!lineups_result.success)
    return create_failure_result(lineups_result.error);

  const jersey_colors_result = await seed_demo_jersey_colors(
    repos.jersey_color,
  );
  if (!jersey_colors_result.success)
    return create_failure_result(jersey_colors_result.error);

  const player_profiles_result = await seed_demo_player_profiles(
    repos.player_profile,
  );
  if (!player_profiles_result.success)
    return create_failure_result(player_profiles_result.error);

  const team_profiles_result = await seed_demo_team_profiles(
    repos.team_profile,
  );
  if (!team_profiles_result.success)
    return create_failure_result(team_profiles_result.error);

  const profile_links_result = await seed_demo_profile_links(
    repos.profile_link,
  );
  if (!profile_links_result.success)
    return create_failure_result(profile_links_result.error);

  return create_success_result(true);
}
