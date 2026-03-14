import {
  get_player_position_repository,
  InBrowserPlayerPositionRepository,
} from "../repositories/InBrowserPlayerPositionRepository";
import {
  get_team_staff_role_repository,
  InBrowserTeamStaffRoleRepository,
} from "../repositories/InBrowserTeamStaffRoleRepository";
import {
  get_game_official_role_repository,
  InBrowserGameOfficialRoleRepository,
} from "../repositories/InBrowserGameOfficialRoleRepository";
import { get_competition_format_repository } from "../repositories/InBrowserCompetitionFormatRepository";
import {
  get_competition_stage_repository,
  InBrowserCompetitionStageRepository,
} from "../repositories/InBrowserCompetitionStageRepository";
import {
  get_player_repository,
  InBrowserPlayerRepository,
} from "../repositories/InBrowserPlayerRepository";
import {
  get_team_repository,
  InBrowserTeamRepository,
} from "../repositories/InBrowserTeamRepository";
import {
  get_team_staff_repository,
  InBrowserTeamStaffRepository,
} from "../repositories/InBrowserTeamStaffRepository";
import {
  get_official_repository,
  InBrowserOfficialRepository,
} from "../repositories/InBrowserOfficialRepository";
import {
  get_competition_repository,
  InBrowserCompetitionRepository,
} from "../repositories/InBrowserCompetitionRepository";
import {
  get_competition_team_repository,
  InBrowserCompetitionTeamRepository,
} from "../repositories/InBrowserCompetitionTeamRepository";
import {
  get_player_team_membership_repository,
  InBrowserPlayerTeamMembershipRepository,
} from "../repositories/InBrowserPlayerTeamMembershipRepository";
import {
  get_fixture_repository,
  InBrowserFixtureRepository,
} from "../repositories/InBrowserFixtureRepository";
import {
  get_fixture_lineup_repository,
  InBrowserFixtureLineupRepository,
} from "../repositories/InBrowserFixtureLineupRepository";
import {
  get_venue_repository,
  InBrowserVenueRepository,
} from "../repositories/InBrowserVenueRepository";
import {
  get_jersey_color_repository,
  InBrowserJerseyColorRepository,
} from "../repositories/InBrowserJerseyColorRepository";
import {
  get_identification_type_repository,
  InBrowserIdentificationTypeRepository,
} from "../repositories/InBrowserIdentificationTypeRepository";
import {
  get_gender_repository,
  InBrowserGenderRepository,
} from "../repositories/InBrowserGenderRepository";
import { seed_default_lookup_entities_for_organization } from "./organizationDefaultsSeeder";
import {
  get_player_profile_repository,
  InBrowserPlayerProfileRepository,
} from "../repositories/InBrowserPlayerProfileRepository";
import {
  get_profile_link_repository,
  InBrowserProfileLinkRepository,
} from "../repositories/InBrowserProfileLinkRepository";
import {
  get_team_profile_repository,
  InBrowserTeamProfileRepository,
} from "../repositories/InBrowserTeamProfileRepository";
import { get_system_user_repository } from "../repositories/InBrowserSystemUserRepository";
import { get_repository_container } from "../../infrastructure/container";
import { get } from "svelte/store";
import { clerk_session } from "../../adapters/iam/clerkAuthService";
import {
  create_seed_players,
  create_seed_teams,
  create_seed_team_staff,
  create_seed_competitions,
  create_seed_competition_teams,
  create_seed_competition_stages,
  create_seed_player_team_memberships,
  create_seed_officials,
  create_seed_fixtures,
  create_seed_fixture_lineups,
  create_seed_venues,
  create_seed_jersey_colors,
  create_seed_player_profiles,
  create_seed_profile_links,
  create_seed_team_profiles,
  create_seed_team_profile_links,
  create_seed_system_users,
  SEED_ORGANIZATION_IDS,
  SEED_SYSTEM_USER_IDS,
  type SeedCompetitionFormatIds,
} from "../../infrastructure/utils/SeedDataGenerator";
import type { PlayerPosition } from "../../core/entities/PlayerPosition";
import type { TeamStaffRole } from "../../core/entities/TeamStaffRole";
import type { GameOfficialRole } from "../../core/entities/GameOfficialRole";
import type { CompetitionFormat } from "../../core/entities/CompetitionFormat";
import { hydrate_competition_format_input } from "../../core/entities/CompetitionFormat";
import {
  EventBus,
  set_user_context,
  clear_user_context,
} from "../../infrastructure/events/EventBus";
import type { SystemUser } from "../../core/entities/SystemUser";
import { current_user_store } from "../../presentation/stores/currentUser";
import {
  try_seed_all_tables_from_convex,
  type ProgressCallback,
  type DataSource,
} from "../../infrastructure/sync/convexSeedingService";
import type { Result, AsyncResult } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";

type SeedingStrategy =
  | "skip_seeding"
  | "convex_first_with_local_fallback"
  | "convex_mandatory";

type SeedOutcome =
  | "skipped"
  | "convex_success"
  | "local_fallback_success"
  | "offline_mode"
  | "convex_required_but_unavailable"
  | "failed";

interface SeedResult {
  success: boolean;
  data_source: DataSource;
  outcome: SeedOutcome;
  error_message: string;
}

interface PositionIds {
  gk: string;
  sw: string;
  cb: string;
  lb: string;
  rb: string;
  cdm: string;
  cm: string;
  lm: string;
  rm: string;
  lw: string;
  rw: string;
  cf: string;
}

interface SeedVenueIds {
  dragon_stadium_id: string;
  thunder_arena_id: string;
  eagle_nest_id: string;
  storm_center_id: string;
  international_hockey_arena_id: string;
}

interface SeedEntityIdLookups {
  position_ids: PositionIds;
  head_coach_role_id: string;
  assistant_coach_role_id: string;
  physio_role_id: string;
  team_manager_role_id: string;
  referee_role_id: string;
  assistant_referee_role_id: string;
  competition_format_ids: SeedCompetitionFormatIds;
}

interface DemoSeedingRepos {
  player: InBrowserPlayerRepository;
  venue: InBrowserVenueRepository;
  team: InBrowserTeamRepository;
  team_staff: InBrowserTeamStaffRepository;
  official: InBrowserOfficialRepository;
  competition: InBrowserCompetitionRepository;
  competition_stage: InBrowserCompetitionStageRepository;
  competition_team: InBrowserCompetitionTeamRepository;
  player_membership: InBrowserPlayerTeamMembershipRepository;
  fixture: InBrowserFixtureRepository;
  fixture_lineup: InBrowserFixtureLineupRepository;
  jersey_color: InBrowserJerseyColorRepository;
  player_profile: InBrowserPlayerProfileRepository;
  team_profile: InBrowserTeamProfileRepository;
  profile_link: InBrowserProfileLinkRepository;
}

const SEEDING_COMPLETE_KEY = "sports_org_seeding_complete_v15";

export function is_seeding_already_complete(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(SEEDING_COMPLETE_KEY) === "true";
}

function mark_seeding_complete(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SEEDING_COMPLETE_KEY, "true");
}

function build_competition_format_repair_signature(
  input: Pick<
    CompetitionFormat,
    | "group_stage_config"
    | "knockout_stage_config"
    | "league_config"
    | "stage_templates"
    | "points_config"
  >,
): string {
  return JSON.stringify({
    group_stage_config: input.group_stage_config,
    knockout_stage_config: input.knockout_stage_config,
    league_config: input.league_config,
    stage_templates: input.stage_templates,
    points_config: input.points_config,
  });
}

async function repair_seeded_competition_formats(): Promise<Result<boolean>> {
  const competition_format_repository = get_competition_format_repository();

  const competition_formats_result =
    await competition_format_repository.find_all(undefined, {
      page_size: 100,
    });

  if (!competition_formats_result.success) {
    console.warn(
      `[Seeding] Failed to load competition formats for repair: ${competition_formats_result.error}`,
    );
    return create_failure_result(competition_formats_result.error);
  }

  for (const competition_format of competition_formats_result.data.items) {
    const repaired_input = hydrate_competition_format_input({
      ...competition_format,
    });

    const existing_signature =
      build_competition_format_repair_signature(competition_format);
    const repaired_signature =
      build_competition_format_repair_signature(repaired_input);

    if (existing_signature === repaired_signature) {
      continue;
    }

    const update_result = await competition_format_repository.update(
      competition_format.id,
      {
        group_stage_config: repaired_input.group_stage_config,
        knockout_stage_config: repaired_input.knockout_stage_config,
        league_config: repaired_input.league_config,
        stage_templates: repaired_input.stage_templates,
        points_config: repaired_input.points_config,
      },
    );

    if (!update_result.success) {
      console.warn(
        `[Seeding] Failed to repair competition format ${competition_format.code}: ${update_result.error}`,
      );
    }
  }

  console.log("[Seeding] Competition format repair completed");
  return create_success_result(true);
}

async function repair_seeded_fixture_stage_ids(): Promise<Result<boolean>> {
  const fixture_repository = get_fixture_repository();
  const competition_stage_repository = get_competition_stage_repository();

  const stages_result = await competition_stage_repository.find_all(
    undefined,
    { page_size: 500 },
  );

  if (!stages_result.success) {
    console.warn(
      `[Seeding] Failed to load competition stages for fixture repair: ${stages_result.error}`,
    );
    return create_failure_result(stages_result.error);
  }

  const sorted_stages = [...stages_result.data.items].sort(
    (a, b) => a.stage_order - b.stage_order,
  );

  const default_stage_per_competition = new Map<string, string>();
  for (const stage of sorted_stages) {
    if (!default_stage_per_competition.has(stage.competition_id)) {
      default_stage_per_competition.set(stage.competition_id, stage.id);
    }
  }

  const fixtures_result = await fixture_repository.find_all(undefined, {
    page_size: 500,
  });

  if (!fixtures_result.success) {
    console.warn(
      `[Seeding] Failed to load fixtures for stage repair: ${fixtures_result.error}`,
    );
    return create_failure_result(fixtures_result.error);
  }

  for (const fixture of fixtures_result.data.items) {
    if (fixture.stage_id && fixture.stage_id.trim().length > 0) {
      continue;
    }

    const default_stage_id = default_stage_per_competition.get(
      fixture.competition_id,
    );

    if (!default_stage_id) {
      console.warn(
        `[Seeding] No stage found for competition ${fixture.competition_id}, skipping fixture ${fixture.id}`,
      );
      continue;
    }

    const update_result = await fixture_repository.update(fixture.id, {
      stage_id: default_stage_id,
    });

    if (!update_result.success) {
      console.warn(
        `[Seeding] Failed to repair stage_id for fixture ${fixture.id}: ${update_result.error}`,
      );
    }
  }

  console.log("[Seeding] Fixture stage ID repair completed");
  return create_success_result(true);
}

function find_position_id_by_code(
  code: string,
  positions: PlayerPosition[],
): string {
  return positions.find((p) => p.code === code)?.id ?? "";
}

function find_staff_role_id_by_code(
  code: string,
  roles: TeamStaffRole[],
): string {
  return roles.find((r) => r.code === code)?.id ?? "";
}

function find_official_role_id_by_code(
  code: string,
  roles: GameOfficialRole[],
): string {
  return roles.find((r) => r.code === code)?.id ?? "";
}

function find_competition_format_id_by_code(
  code: string,
  formats: CompetitionFormat[],
): string {
  return formats.find((f) => f.code === code)?.id ?? "";
}

async function load_and_set_current_user(): Promise<Result<SystemUser>> {
  const container = get_repository_container();
  const system_user_repository = container.system_user_repository;

  const clerk_state = get(clerk_session);
  const clerk_email = clerk_state.user?.email_address?.toLowerCase() ?? null;

  if (!clerk_email) {
    console.log(
      "[Seeding] No Clerk session active — skipping current user resolution",
    );
    return create_failure_result("No Clerk session active");
  }

  const by_email_result =
    await system_user_repository.find_by_email(clerk_email);

  if (!by_email_result.success || by_email_result.data.items.length === 0) {
    console.warn(
      `[Seeding] No system user found in local DB for Clerk email: ${clerk_email}. ` +
        "Sync may not have completed yet.",
    );
    return create_failure_result(
      `No system user found for email: ${clerk_email}`,
    );
  }

  const matched_user = by_email_result.data.items[0];
  set_user_context({
    user_id: matched_user.id,
    user_email: matched_user.email,
    user_display_name: `${matched_user.first_name} ${matched_user.last_name}`,
    organization_id: matched_user.organization_id,
  });
  current_user_store.set_user(matched_user);
  console.log(
    `[Seeding] Current user resolved: ${matched_user.email} (role: ${matched_user.role})`,
  );
  return create_success_result(matched_user);
}

async function seed_super_admin_user(): Promise<Result<SystemUser>> {
  const system_user_repository = get_system_user_repository();

  const seed_users = create_seed_system_users();
  await system_user_repository.seed_with_data(seed_users);

  const super_admin = seed_users.find(
    (user) => user.id === SEED_SYSTEM_USER_IDS.SYSTEM_ADMINISTRATOR,
  );

  if (!super_admin) {
    console.error("Failed to seed super admin user");
    return create_failure_result("Failed to seed super admin user");
  }

  return create_success_result(super_admin);
}

function emit_entity_created_events<T extends { id: string }>(
  entity_type: string,
  entities: T[],
  get_display_name: (entity: T) => string,
): void {
  for (const entity of entities) {
    EventBus.emit_entity_created(
      entity_type,
      entity.id,
      get_display_name(entity),
      entity as unknown as Record<string, unknown>,
    );
  }
}

async function load_seed_entity_id_lookups(
  player_position_repository: InBrowserPlayerPositionRepository,
  team_staff_role_repository: InBrowserTeamStaffRoleRepository,
  official_role_repository: InBrowserGameOfficialRoleRepository,
  competition_format_repository: ReturnType<typeof get_competition_format_repository>,
): Promise<Result<SeedEntityIdLookups>> {
  console.log("[Seeding] Loading entity ID lookups from seeded data");

  const positions_result = await player_position_repository.find_all(undefined, { page_size: 100 });
  if (!positions_result.success) return create_failure_result(`Failed to load positions: ${positions_result.error}`);

  const staff_roles_result = await team_staff_role_repository.find_all_with_filter(undefined, { page_size: 100 });
  if (!staff_roles_result.success) return create_failure_result(`Failed to load staff roles: ${staff_roles_result.error}`);

  const official_roles_result = await official_role_repository.find_all_with_filter(undefined, { page_size: 100 });
  if (!official_roles_result.success) return create_failure_result(`Failed to load official roles: ${official_roles_result.error}`);

  const formats_result = await competition_format_repository.find_all(undefined, { page_size: 100 });
  if (!formats_result.success) return create_failure_result(`Failed to load competition formats: ${formats_result.error}`);

  const positions = positions_result.data.items;
  const staff_roles = staff_roles_result.data.items;
  const official_roles = official_roles_result.data.items;
  const formats = formats_result.data.items;

  const lookups: SeedEntityIdLookups = {
    position_ids: {
      gk: find_position_id_by_code("GK", positions),
      sw: find_position_id_by_code("SW", positions),
      cb: find_position_id_by_code("CB", positions),
      lb: find_position_id_by_code("LB", positions),
      rb: find_position_id_by_code("RB", positions),
      cdm: find_position_id_by_code("CDM", positions),
      cm: find_position_id_by_code("CM", positions),
      lm: find_position_id_by_code("LM", positions),
      rm: find_position_id_by_code("RM", positions),
      lw: find_position_id_by_code("LW", positions),
      rw: find_position_id_by_code("RW", positions),
      cf: find_position_id_by_code("CF", positions),
    },
    head_coach_role_id: find_staff_role_id_by_code("HC", staff_roles),
    assistant_coach_role_id: find_staff_role_id_by_code("AC", staff_roles),
    physio_role_id: find_staff_role_id_by_code("PHYSIO", staff_roles),
    team_manager_role_id: find_staff_role_id_by_code("TM", staff_roles),
    referee_role_id: find_official_role_id_by_code("REF", official_roles),
    assistant_referee_role_id: find_official_role_id_by_code("AR", official_roles),
    competition_format_ids: {
      easter_cup_format_id: find_competition_format_id_by_code("world_cup_style", formats),
      uganda_cup_format_id: find_competition_format_id_by_code("cup_tournament", formats),
      nhl_format_id: find_competition_format_id_by_code("standard_league", formats),
      university_format_id: find_competition_format_id_by_code("single_round_robin", formats),
    },
  };

  console.log("[Seeding] Entity ID lookups loaded successfully");
  return create_success_result(lookups);
}

function build_demo_seeding_repos(): DemoSeedingRepos {
  return {
    player: get_player_repository() as InBrowserPlayerRepository,
    venue: get_venue_repository() as InBrowserVenueRepository,
    team: get_team_repository() as InBrowserTeamRepository,
    team_staff: get_team_staff_repository() as InBrowserTeamStaffRepository,
    official: get_official_repository() as InBrowserOfficialRepository,
    competition: get_competition_repository() as InBrowserCompetitionRepository,
    competition_stage: get_competition_stage_repository() as InBrowserCompetitionStageRepository,
    competition_team: get_competition_team_repository() as InBrowserCompetitionTeamRepository,
    player_membership: get_player_team_membership_repository() as InBrowserPlayerTeamMembershipRepository,
    fixture: get_fixture_repository() as InBrowserFixtureRepository,
    fixture_lineup: get_fixture_lineup_repository() as InBrowserFixtureLineupRepository,
    jersey_color: get_jersey_color_repository() as InBrowserJerseyColorRepository,
    player_profile: get_player_profile_repository() as InBrowserPlayerProfileRepository,
    team_profile: get_team_profile_repository() as InBrowserTeamProfileRepository,
    profile_link: get_profile_link_repository() as InBrowserProfileLinkRepository,
  };
}

async function seed_demo_players(
  organization_id: string,
  player_repository: InBrowserPlayerRepository,
  position_ids: PositionIds,
): Promise<Result<number>> {
  console.log(`[Seeding] Seeding demo players for org: ${organization_id}`);
  const seed_players = create_seed_players(position_ids, organization_id);
  for (const player of seed_players) {
    const result = await player_repository.seed_with_data([player]);
    if (!result.success) {
      console.error(`[Seeding] Player seeding failed: ${result.error}`);
      return create_failure_result(`Player seeding failed: ${result.error}`);
    }
  }
  emit_entity_created_events("player", seed_players, (p) => `${p.first_name} ${p.last_name}`);
  console.log(`[Seeding] Seeded ${seed_players.length} players`);
  return create_success_result(seed_players.length);
}

async function seed_demo_venues(
  organization_id: string,
  venue_repository: InBrowserVenueRepository,
): Promise<Result<SeedVenueIds>> {
  console.log(`[Seeding] Seeding demo venues for org: ${organization_id}`);
  const seed_venues = create_seed_venues(organization_id);
  const result = await venue_repository.seed_with_data(seed_venues);
  if (!result.success) {
    console.error(`[Seeding] Venue seeding failed: ${result.error}`);
    return create_failure_result(`Venue seeding failed: ${result.error}`);
  }
  emit_entity_created_events("venue", seed_venues, (v) => v.name);
  console.log(`[Seeding] Seeded ${seed_venues.length} venues`);
  return create_success_result({
    dragon_stadium_id: seed_venues[0]?.id ?? "",
    thunder_arena_id: seed_venues[1]?.id ?? "",
    eagle_nest_id: seed_venues[2]?.id ?? "",
    storm_center_id: seed_venues[3]?.id ?? "",
    international_hockey_arena_id: seed_venues[4]?.id ?? "",
  });
}

async function seed_demo_teams(
  team_repository: InBrowserTeamRepository,
  venue_ids: SeedVenueIds,
): Promise<Result<number>> {
  console.log("[Seeding] Seeding demo teams");
  const seed_teams = create_seed_teams(
    venue_ids.dragon_stadium_id,
    venue_ids.thunder_arena_id,
    venue_ids.eagle_nest_id,
    venue_ids.storm_center_id,
    venue_ids.international_hockey_arena_id,
  );
  const result = await team_repository.seed_with_data(seed_teams);
  if (!result.success) {
    console.error(`[Seeding] Team seeding failed: ${result.error}`);
    return create_failure_result(`Team seeding failed: ${result.error}`);
  }
  emit_entity_created_events("team", seed_teams, (t) => t.name);
  console.log(`[Seeding] Seeded ${seed_teams.length} teams`);
  return create_success_result(seed_teams.length);
}

async function seed_demo_team_staff(
  team_staff_repository: InBrowserTeamStaffRepository,
  entity_id_lookups: SeedEntityIdLookups,
): Promise<Result<number>> {
  console.log("[Seeding] Seeding demo team staff");
  const seed_staff = create_seed_team_staff(
    entity_id_lookups.head_coach_role_id,
    entity_id_lookups.assistant_coach_role_id,
    entity_id_lookups.physio_role_id,
    entity_id_lookups.team_manager_role_id,
  );
  const result = await team_staff_repository.seed_with_data(seed_staff);
  if (!result.success) {
    console.error(`[Seeding] Team staff seeding failed: ${result.error}`);
    return create_failure_result(`Team staff seeding failed: ${result.error}`);
  }
  emit_entity_created_events("team_staff", seed_staff, (s) => `${s.first_name} ${s.last_name}`);
  console.log(`[Seeding] Seeded ${seed_staff.length} team staff`);
  return create_success_result(seed_staff.length);
}

async function seed_demo_officials(
  organization_id: string,
  official_repository: InBrowserOfficialRepository,
): Promise<Result<number>> {
  console.log(`[Seeding] Seeding demo officials for org: ${organization_id}`);
  const seed_officials = create_seed_officials(organization_id);
  const result = await official_repository.seed_with_data(seed_officials);
  if (!result.success) {
    console.error(`[Seeding] Official seeding failed: ${result.error}`);
    return create_failure_result(`Official seeding failed: ${result.error}`);
  }
  emit_entity_created_events("official", seed_officials, (o) => `${o.first_name} ${o.last_name}`);
  console.log(`[Seeding] Seeded ${seed_officials.length} officials`);
  return create_success_result(seed_officials.length);
}

async function seed_demo_competitions(
  competition_repository: InBrowserCompetitionRepository,
  entity_id_lookups: SeedEntityIdLookups,
): Promise<Result<number>> {
  console.log("[Seeding] Seeding demo competitions");
  const seed_competitions = create_seed_competitions(entity_id_lookups.competition_format_ids);
  const result = await competition_repository.seed_with_data(seed_competitions);
  if (!result.success) {
    console.error(`[Seeding] Competition seeding failed: ${result.error}`);
    return create_failure_result(`Competition seeding failed: ${result.error}`);
  }
  emit_entity_created_events("competition", seed_competitions, (c) => c.name);
  console.log(`[Seeding] Seeded ${seed_competitions.length} competitions`);
  return create_success_result(seed_competitions.length);
}

async function seed_demo_competition_stages(
  competition_stage_repository: InBrowserCompetitionStageRepository,
): Promise<Result<number>> {
  console.log("[Seeding] Seeding demo competition stages");
  const seed_competition_stages = create_seed_competition_stages();
  const result = await competition_stage_repository.seed_with_data(seed_competition_stages);
  if (!result.success) {
    console.error(`[Seeding] Competition stage seeding failed: ${result.error}`);
    return create_failure_result(`Competition stage seeding failed: ${result.error}`);
  }
  emit_entity_created_events("competition_stage", seed_competition_stages, (s) => `${s.name} (${s.competition_id})`);
  console.log(`[Seeding] Seeded ${seed_competition_stages.length} competition stages`);
  return create_success_result(seed_competition_stages.length);
}

async function seed_demo_competition_teams(
  competition_team_repository: InBrowserCompetitionTeamRepository,
): Promise<Result<number>> {
  console.log("[Seeding] Seeding demo competition teams");
  const seed_competition_teams = create_seed_competition_teams();
  const result = await competition_team_repository.seed_with_data(seed_competition_teams);
  if (!result.success) {
    console.error(`[Seeding] Competition team seeding failed: ${result.error}`);
    return create_failure_result(`Competition team seeding failed: ${result.error}`);
  }
  emit_entity_created_events("competition_team", seed_competition_teams, (ct) => `Team ${ct.team_id} in Competition ${ct.competition_id}`);
  console.log(`[Seeding] Seeded ${seed_competition_teams.length} competition teams`);
  return create_success_result(seed_competition_teams.length);
}

async function seed_demo_player_memberships(
  player_membership_repository: InBrowserPlayerTeamMembershipRepository,
): Promise<Result<number>> {
  console.log("[Seeding] Seeding demo player memberships");
  const seed_memberships = create_seed_player_team_memberships();
  const result = await player_membership_repository.seed_with_data(seed_memberships);
  if (!result.success) {
    console.error(`[Seeding] Player membership seeding failed: ${result.error}`);
    return create_failure_result(`Player membership seeding failed: ${result.error}`);
  }
  emit_entity_created_events("player_team_membership", seed_memberships, (m) => `Player ${m.player_id} -> Team ${m.team_id}`);
  console.log(`[Seeding] Seeded ${seed_memberships.length} player memberships`);
  return create_success_result(seed_memberships.length);
}

async function seed_demo_fixtures(
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
  emit_entity_created_events("fixture", seed_fixtures, (f) => `${f.venue} - Round ${f.round_number}`);
  console.log(`[Seeding] Seeded ${seed_fixtures.length} fixtures`);
  return create_success_result(seed_fixtures.length);
}

async function seed_demo_fixture_lineups(
  fixture_lineup_repository: InBrowserFixtureLineupRepository,
): Promise<Result<number>> {
  console.log("[Seeding] Seeding demo fixture lineups");
  const seed_lineups = create_seed_fixture_lineups();
  const result = await fixture_lineup_repository.seed_with_data(seed_lineups);
  if (!result.success) {
    console.error(`[Seeding] Fixture lineup seeding failed: ${result.error}`);
    return create_failure_result(`Fixture lineup seeding failed: ${result.error}`);
  }
  emit_entity_created_events("fixture_lineup", seed_lineups, (l) => `Lineup for fixture ${l.fixture_id} - Team ${l.team_id}`);
  console.log(`[Seeding] Seeded ${seed_lineups.length} fixture lineups`);
  return create_success_result(seed_lineups.length);
}

async function seed_demo_jersey_colors(
  jersey_color_repository: InBrowserJerseyColorRepository,
): Promise<Result<number>> {
  console.log("[Seeding] Seeding demo jersey colors");
  const seed_jersey_colors = create_seed_jersey_colors();
  const result = await jersey_color_repository.seed_with_data(seed_jersey_colors);
  if (!result.success) {
    console.error(`[Seeding] Jersey color seeding failed: ${result.error}`);
    return create_failure_result(`Jersey color seeding failed: ${result.error}`);
  }
  emit_entity_created_events("jersey_color", seed_jersey_colors, (j) => `${j.nickname} (${j.main_color})`);
  console.log(`[Seeding] Seeded ${seed_jersey_colors.length} jersey colors`);
  return create_success_result(seed_jersey_colors.length);
}

async function seed_demo_player_profiles(
  player_profile_repository: InBrowserPlayerProfileRepository,
): Promise<Result<number>> {
  console.log("[Seeding] Seeding demo player profiles");
  const seed_player_profiles = create_seed_player_profiles();
  const result = await player_profile_repository.seed_with_data(seed_player_profiles);
  if (!result.success) {
    console.error(`[Seeding] Player profile seeding failed: ${result.error}`);
    return create_failure_result(`Player profile seeding failed: ${result.error}`);
  }
  emit_entity_created_events("player_profile", seed_player_profiles, (p) => `Profile: ${p.profile_slug}`);
  console.log(`[Seeding] Seeded ${seed_player_profiles.length} player profiles`);
  return create_success_result(seed_player_profiles.length);
}

async function seed_demo_team_profiles(
  team_profile_repository: InBrowserTeamProfileRepository,
): Promise<Result<number>> {
  console.log("[Seeding] Seeding demo team profiles");
  const seed_team_profiles = create_seed_team_profiles();
  const result = await team_profile_repository.seed_with_data(seed_team_profiles);
  if (!result.success) {
    console.error(`[Seeding] Team profile seeding failed: ${result.error}`);
    return create_failure_result(`Team profile seeding failed: ${result.error}`);
  }
  emit_entity_created_events("team_profile", seed_team_profiles, (p) => `Team Profile: ${p.profile_slug}`);
  console.log(`[Seeding] Seeded ${seed_team_profiles.length} team profiles`);
  return create_success_result(seed_team_profiles.length);
}

async function seed_demo_profile_links(
  profile_link_repository: InBrowserProfileLinkRepository,
): Promise<Result<number>> {
  console.log("[Seeding] Seeding demo profile links");
  const all_profile_links = [...create_seed_profile_links(), ...create_seed_team_profile_links()];
  const result = await profile_link_repository.seed_with_data(all_profile_links);
  if (!result.success) {
    console.error(`[Seeding] Profile link seeding failed: ${result.error}`);
    return create_failure_result(`Profile link seeding failed: ${result.error}`);
  }
  emit_entity_created_events("profile_link", all_profile_links, (l) => `Link: ${l.title}`);
  console.log(`[Seeding] Seeded ${all_profile_links.length} profile links`);
  return create_success_result(all_profile_links.length);
}

async function seed_all_demo_entities(
  organization_id: string,
  entity_id_lookups: SeedEntityIdLookups,
  repos: DemoSeedingRepos,
): Promise<Result<boolean>> {
  const players_result = await seed_demo_players(organization_id, repos.player, entity_id_lookups.position_ids);
  if (!players_result.success) return create_failure_result(players_result.error);

  const venues_result = await seed_demo_venues(organization_id, repos.venue);
  if (!venues_result.success) return create_failure_result(venues_result.error);

  const teams_result = await seed_demo_teams(repos.team, venues_result.data);
  if (!teams_result.success) return create_failure_result(teams_result.error);

  const staff_result = await seed_demo_team_staff(repos.team_staff, entity_id_lookups);
  if (!staff_result.success) return create_failure_result(staff_result.error);

  const officials_result = await seed_demo_officials(organization_id, repos.official);
  if (!officials_result.success) return create_failure_result(officials_result.error);

  const competitions_result = await seed_demo_competitions(repos.competition, entity_id_lookups);
  if (!competitions_result.success) return create_failure_result(competitions_result.error);

  const stages_result = await seed_demo_competition_stages(repos.competition_stage);
  if (!stages_result.success) return create_failure_result(stages_result.error);

  const comp_teams_result = await seed_demo_competition_teams(repos.competition_team);
  if (!comp_teams_result.success) return create_failure_result(comp_teams_result.error);

  const memberships_result = await seed_demo_player_memberships(repos.player_membership);
  if (!memberships_result.success) return create_failure_result(memberships_result.error);

  const fixtures_result = await seed_demo_fixtures(repos.fixture, entity_id_lookups);
  if (!fixtures_result.success) return create_failure_result(fixtures_result.error);

  const lineups_result = await seed_demo_fixture_lineups(repos.fixture_lineup);
  if (!lineups_result.success) return create_failure_result(lineups_result.error);

  const jersey_colors_result = await seed_demo_jersey_colors(repos.jersey_color);
  if (!jersey_colors_result.success) return create_failure_result(jersey_colors_result.error);

  const player_profiles_result = await seed_demo_player_profiles(repos.player_profile);
  if (!player_profiles_result.success) return create_failure_result(player_profiles_result.error);

  const team_profiles_result = await seed_demo_team_profiles(repos.team_profile);
  if (!team_profiles_result.success) return create_failure_result(team_profiles_result.error);

  const profile_links_result = await seed_demo_profile_links(repos.profile_link);
  if (!profile_links_result.success) return create_failure_result(profile_links_result.error);

  return create_success_result(true);
}

export async function seed_all_data_if_needed(): Promise<Result<boolean>> {
  if (is_seeding_already_complete()) {
    const formats_repair_result = await repair_seeded_competition_formats();
    if (!formats_repair_result.success) {
      console.warn(`[Seeding] Competition format repair failed: ${formats_repair_result.error}`);
    }
    const fixtures_repair_result = await repair_seeded_fixture_stage_ids();
    if (!fixtures_repair_result.success) {
      console.warn(`[Seeding] Fixture stage repair failed: ${fixtures_repair_result.error}`);
    }
    const current_user_result = await load_and_set_current_user();
    if (!current_user_result.success) {
      console.warn(`[Seeding] Could not resolve current user: ${current_user_result.error}`);
    }
    return create_success_result(true);
  }

  if (typeof window === "undefined") {
    return create_failure_result("Not in browser environment");
  }

  const super_admin_result = await seed_super_admin_user();
  if (!super_admin_result.success) {
    console.error(`[SEED] Failed to create super admin: ${super_admin_result.error}`);
    return create_failure_result(super_admin_result.error);
  }

  const super_admin = super_admin_result.data;
  set_user_context({
    user_id: super_admin.id,
    user_email: super_admin.email,
    user_display_name: `${super_admin.first_name} ${super_admin.last_name}`,
    organization_id: super_admin.organization_id,
  });
  current_user_store.set_user(super_admin);
  EventBus.emit_entity_created(
    "system_user",
    super_admin.id,
    `${super_admin.first_name} ${super_admin.last_name}`,
    super_admin as unknown as Record<string, unknown>,
  );

  const org_seed_result = await seed_default_lookup_entities_for_organization(
    SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  );
  if (!org_seed_result.success) {
    return create_failure_result(`Org defaults seeding failed: ${org_seed_result.error}`);
  }

  const lookups_result = await load_seed_entity_id_lookups(
    get_player_position_repository() as InBrowserPlayerPositionRepository,
    get_team_staff_role_repository() as InBrowserTeamStaffRoleRepository,
    get_game_official_role_repository() as InBrowserGameOfficialRoleRepository,
    get_competition_format_repository(),
  );
  if (!lookups_result.success) {
    return create_failure_result(`Entity ID lookup failed: ${lookups_result.error}`);
  }

  const entities_result = await seed_all_demo_entities(
    SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
    lookups_result.data,
    build_demo_seeding_repos(),
  );
  if (!entities_result.success) {
    return create_failure_result(entities_result.error);
  }

  const formats_repair_result = await repair_seeded_competition_formats();
  if (!formats_repair_result.success) {
    console.warn(`[Seeding] Competition format repair failed: ${formats_repair_result.error}`);
  }
  const fixtures_repair_result = await repair_seeded_fixture_stage_ids();
  if (!fixtures_repair_result.success) {
    console.warn(`[Seeding] Fixture stage repair failed: ${fixtures_repair_result.error}`);
  }
  clear_user_context();
  mark_seeding_complete();
  return create_success_result(true);
}

export function reset_seeding_flag(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SEEDING_COMPLETE_KEY);
}

export async function seed_from_convex_or_local(
  on_progress: ProgressCallback,
  strategy: SeedingStrategy,
): Promise<SeedResult> {
  switch (strategy) {
    case "skip_seeding":
      return handle_skip_seeding();
    case "convex_first_with_local_fallback":
      return handle_convex_with_local_fallback(on_progress);
    case "convex_mandatory":
      return handle_convex_mandatory(on_progress);
  }
}

function handle_skip_seeding(): SeedResult {
  console.log("[Seeding] Skip strategy — public viewer, no seeding needed");
  return {
    success: true,
    data_source: "none",
    outcome: "skipped",
    error_message: "",
  };
}

async function handle_convex_with_local_fallback(
  on_progress: ProgressCallback,
): Promise<SeedResult> {
  if (is_seeding_already_complete()) {
    const formats_repair_result_1 = await repair_seeded_competition_formats();
    if (!formats_repair_result_1.success) {
      console.warn(`[Seeding] Competition format repair failed: ${formats_repair_result_1.error}`);
    }
    const fixtures_repair_result_1 = await repair_seeded_fixture_stage_ids();
    if (!fixtures_repair_result_1.success) {
      console.warn(`[Seeding] Fixture stage repair failed: ${fixtures_repair_result_1.error}`);
    }
    const current_user_result_2 = await load_and_set_current_user();
    if (!current_user_result_2.success) {
      console.warn(
        `[Seeding] Could not resolve current user: ${current_user_result_2.error}`,
      );
    }
    return {
      success: true,
      data_source: "local",
      outcome: "local_fallback_success",
      error_message: "",
    };
  }

  if (typeof window === "undefined") {
    return {
      success: false,
      data_source: "none",
      outcome: "failed",
      error_message: "Not in browser environment",
    };
  }

  on_progress("Connecting to server...", 15);
  const convex_result = await try_seed_all_tables_from_convex(on_progress);

  if (convex_result.success) {
    on_progress("Server data loaded successfully", 85);
    console.log(
      `[Seeding] Convex seeding succeeded: ${convex_result.total_records} records from ${convex_result.tables_fetched} tables`,
    );
    const formats_repair_result_2 = await repair_seeded_competition_formats();
    if (!formats_repair_result_2.success) {
      console.warn(`[Seeding] Competition format repair failed: ${formats_repair_result_2.error}`);
    }
    const fixtures_repair_result_2 = await repair_seeded_fixture_stage_ids();
    if (!fixtures_repair_result_2.success) {
      console.warn(`[Seeding] Fixture stage repair failed: ${fixtures_repair_result_2.error}`);
    }
    const current_user_result_3 = await load_and_set_current_user();
    if (!current_user_result_3.success) {
      console.warn(
        `[Seeding] Could not resolve current user: ${current_user_result_3.error}`,
      );
    }
    mark_seeding_complete();
    return {
      success: true,
      data_source: "convex",
      outcome: "convex_success",
      error_message: "",
    };
  }

  console.log("[Seeding] Convex unavailable, falling back to local demo data");
  on_progress("Server unavailable, loading demo data...", 40);
  const local_seed_result = await seed_all_data_if_needed();
  const local_success = local_seed_result.success;

  return {
    success: local_success,
    data_source: local_success ? "local" : "none",
    outcome: local_success ? "local_fallback_success" : "failed",
    error_message: local_success ? "" : "Both Convex and local seeding failed",
  };
}

async function handle_convex_mandatory(
  on_progress: ProgressCallback,
): Promise<SeedResult> {
  const seeding_already_done = is_seeding_already_complete();

  if (typeof window === "undefined") {
    return {
      success: false,
      data_source: "none",
      outcome: "failed",
      error_message: "Not in browser environment",
    };
  }

  on_progress("Pulling data from server...", 15);
  const convex_result = await try_seed_all_tables_from_convex(on_progress);

  if (convex_result.success) {
    on_progress("Server data loaded successfully", 85);
    console.log(
      `[Seeding] Convex pull succeeded: ${convex_result.total_records} records from ${convex_result.tables_fetched} tables`,
    );
    const formats_repair_result_3 = await repair_seeded_competition_formats();
    if (!formats_repair_result_3.success) {
      console.warn(`[Seeding] Competition format repair failed: ${formats_repair_result_3.error}`);
    }
    const fixtures_repair_result_3 = await repair_seeded_fixture_stage_ids();
    if (!fixtures_repair_result_3.success) {
      console.warn(`[Seeding] Fixture stage repair failed: ${fixtures_repair_result_3.error}`);
    }
    const current_user_result_4 = await load_and_set_current_user();
    if (!current_user_result_4.success) {
      console.warn(
        `[Seeding] Could not resolve current user: ${current_user_result_4.error}`,
      );
    }
    mark_seeding_complete();
    return {
      success: true,
      data_source: "convex",
      outcome: "convex_success",
      error_message: "",
    };
  }

  if (seeding_already_done) {
    console.log(
      "[Seeding] Convex unavailable but local data exists — entering offline mode",
    );
    const formats_repair_result_4 = await repair_seeded_competition_formats();
    if (!formats_repair_result_4.success) {
      console.warn(`[Seeding] Competition format repair failed: ${formats_repair_result_4.error}`);
    }
    const fixtures_repair_result_4 = await repair_seeded_fixture_stage_ids();
    if (!fixtures_repair_result_4.success) {
      console.warn(`[Seeding] Fixture stage repair failed: ${fixtures_repair_result_4.error}`);
    }
    const current_user_result_5 = await load_and_set_current_user();
    if (!current_user_result_5.success) {
      console.warn(
        `[Seeding] Could not resolve current user: ${current_user_result_5.error}`,
      );
    }
    return {
      success: true,
      data_source: "local",
      outcome: "offline_mode",
      error_message:
        "Unable to fetch the latest data from the server. Using previously saved data.",
    };
  }

  console.error(
    "[Seeding] Convex unavailable and no local data — cannot proceed",
  );
  return {
    success: false,
    data_source: "none",
    outcome: "convex_required_but_unavailable",
    error_message:
      "Unable to connect to the server to load your data. Please check your internet connection and try again.",
  };
}

export type { SeedResult, DataSource, SeedingStrategy, SeedOutcome };
