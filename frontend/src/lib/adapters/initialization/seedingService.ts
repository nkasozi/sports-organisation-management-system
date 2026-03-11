import { get_player_position_repository } from "../repositories/InBrowserPlayerPositionRepository";
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
  create_seed_genders,
  create_seed_identification_types,
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

const SEEDING_COMPLETE_KEY = "sports_org_seeding_complete_v14";

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

async function repair_seeded_competition_formats(): Promise<boolean> {
  const competition_format_repository = get_competition_format_repository();

  try {
    const competition_formats_result =
      await competition_format_repository.find_all(undefined, {
        page_size: 100,
      });

    if (!competition_formats_result.success) {
      console.warn(
        `[Seeding] Failed to load competition formats for repair: ${competition_formats_result.error}`,
      );
      return false;
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

    return true;
  } catch (error) {
    console.warn(`[Seeding] Competition format repair failed: ${error}`);
    return false;
  }
}

async function repair_seeded_fixture_stage_ids(): Promise<boolean> {
  const fixture_repository = get_fixture_repository();
  const competition_stage_repository = get_competition_stage_repository();

  try {
    const stages_result = await competition_stage_repository.find_all(
      undefined,
      { page_size: 500 },
    );

    if (!stages_result.success) {
      console.warn(
        `[Seeding] Failed to load competition stages for fixture repair: ${stages_result.error}`,
      );
      return false;
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
      return false;
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

    return true;
  } catch (error) {
    console.warn(`[Seeding] Fixture stage repair failed: ${error}`);
    return false;
  }
}

async function find_position_id_by_code(
  code: string,
  positions: PlayerPosition[],
): Promise<string> {
  const position = positions.find((p) => p.code === code);
  return position?.id ?? "";
}

async function find_staff_role_id_by_code(
  code: string,
  roles: TeamStaffRole[],
): Promise<string> {
  const role = roles.find((r) => r.code === code);
  return role?.id ?? "";
}

async function find_official_role_id_by_code(
  code: string,
  roles: GameOfficialRole[],
): Promise<string> {
  const role = roles.find((r) => r.code === code);
  return role?.id ?? "";
}

async function find_competition_format_id_by_code(
  code: string,
  formats: CompetitionFormat[],
): Promise<string> {
  const format = formats.find((f) => f.code === code);
  return format?.id ?? "";
}

async function load_and_set_current_user(): Promise<SystemUser | null> {
  const container = get_repository_container();
  const system_user_repository = container.system_user_repository;

  const admin_result = await system_user_repository.find_by_id(
    SEED_SYSTEM_USER_IDS.SYSTEM_ADMINISTRATOR,
  );

  if (admin_result.success && admin_result.data) {
    set_user_context({
      user_id: admin_result.data.id,
      user_email: admin_result.data.email,
      user_display_name: `${admin_result.data.first_name} ${admin_result.data.last_name}`,
      organization_id: admin_result.data.organization_id,
    });

    current_user_store.set_user(admin_result.data);
    return admin_result.data;
  }

  const existing_users_result = await system_user_repository.find_all(
    undefined,
    {
      page_size: 100,
    },
  );

  if (!existing_users_result.success) return null;

  const super_admin = existing_users_result.data.items.find(
    (user) => user.role === "super_admin",
  );

  if (!super_admin) return null;

  set_user_context({
    user_id: super_admin.id,
    user_email: super_admin.email,
    user_display_name: `${super_admin.first_name} ${super_admin.last_name}`,
    organization_id: super_admin.organization_id,
  });

  current_user_store.set_user(super_admin);

  return super_admin;
}

async function seed_super_admin_user(): Promise<SystemUser | null> {
  const system_user_repository = get_system_user_repository();

  const seed_users = create_seed_system_users();
  await system_user_repository.seed_with_data(seed_users);

  const super_admin = seed_users.find(
    (user) => user.id === SEED_SYSTEM_USER_IDS.SYSTEM_ADMINISTRATOR,
  );

  if (!super_admin) {
    console.error("Failed to seed super admin user");
    return null;
  }

  return super_admin;
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

export async function seed_all_data_if_needed(): Promise<boolean> {
  if (is_seeding_already_complete()) {
    await repair_seeded_competition_formats();
    await repair_seeded_fixture_stage_ids();
    await load_and_set_current_user();
    return true;
  }
  if (typeof window === "undefined") return false;

  const super_admin = await seed_super_admin_user();

  if (!super_admin) {
    console.error("[SEED] Failed to create super admin, aborting seeding");
    return false;
  }

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

  const player_position_repository = get_player_position_repository();
  const team_staff_role_repository =
    get_team_staff_role_repository() as InBrowserTeamStaffRoleRepository;
  const official_role_repository =
    get_game_official_role_repository() as InBrowserGameOfficialRoleRepository;
  const competition_format_repository = get_competition_format_repository();
  const player_repository =
    get_player_repository() as InBrowserPlayerRepository;
  const team_repository = get_team_repository() as InBrowserTeamRepository;
  const team_staff_repository =
    get_team_staff_repository() as InBrowserTeamStaffRepository;
  const official_repository =
    get_official_repository() as InBrowserOfficialRepository;
  const competition_repository =
    get_competition_repository() as InBrowserCompetitionRepository;
  const player_team_membership_repository =
    get_player_team_membership_repository() as InBrowserPlayerTeamMembershipRepository;
  const fixture_repository =
    get_fixture_repository() as InBrowserFixtureRepository;
  const venue_repository = get_venue_repository() as InBrowserVenueRepository;
  const gender_repository =
    get_gender_repository() as InBrowserGenderRepository;

  const seed_genders = create_seed_genders();
  await gender_repository.seed_with_data(seed_genders);
  emit_entity_created_events("gender", seed_genders, (gender) => gender.name);

  const positions_result = await player_position_repository.find_all(
    undefined,
    {
      page_size: 100,
    },
  );
  const positions = positions_result.success ? positions_result.data.items : [];

  const staff_roles_result =
    await team_staff_role_repository.find_all_with_filter(undefined, {
      page_size: 100,
    });
  const staff_roles = staff_roles_result.success
    ? staff_roles_result.data.items
    : [];

  const official_roles_result =
    await official_role_repository.find_all_with_filter(undefined, {
      page_size: 100,
    });
  const official_roles = official_roles_result.success
    ? official_roles_result.data.items
    : [];

  const competition_formats_result =
    await competition_format_repository.find_all(undefined, { page_size: 100 });
  const competition_formats = competition_formats_result.success
    ? competition_formats_result.data.items
    : [];

  const position_id_gk = await find_position_id_by_code("GK", positions);
  const position_id_sw = await find_position_id_by_code("SW", positions);
  const position_id_cb = await find_position_id_by_code("CB", positions);
  const position_id_lb = await find_position_id_by_code("LB", positions);
  const position_id_rb = await find_position_id_by_code("RB", positions);
  const position_id_cdm = await find_position_id_by_code("CDM", positions);
  const position_id_cm = await find_position_id_by_code("CM", positions);
  const position_id_lm = await find_position_id_by_code("LM", positions);
  const position_id_rm = await find_position_id_by_code("RM", positions);
  const position_id_lw = await find_position_id_by_code("LW", positions);
  const position_id_rw = await find_position_id_by_code("RW", positions);
  const position_id_cf = await find_position_id_by_code("CF", positions);

  const position_ids = {
    gk: position_id_gk,
    sw: position_id_sw,
    cb: position_id_cb,
    lb: position_id_lb,
    rb: position_id_rb,
    cdm: position_id_cdm,
    cm: position_id_cm,
    lm: position_id_lm,
    rm: position_id_rm,
    lw: position_id_lw,
    rw: position_id_rw,
    cf: position_id_cf,
  };

  const head_coach_role_id = await find_staff_role_id_by_code(
    "HC",
    staff_roles,
  );
  const assistant_coach_role_id = await find_staff_role_id_by_code(
    "AC",
    staff_roles,
  );
  const physio_role_id = await find_staff_role_id_by_code(
    "PHYSIO",
    staff_roles,
  );
  const team_manager_role_id = await find_staff_role_id_by_code(
    "TM",
    staff_roles,
  );

  const referee_role_id = await find_official_role_id_by_code(
    "REF",
    official_roles,
  );
  const assistant_referee_role_id = await find_official_role_id_by_code(
    "AR",
    official_roles,
  );

  const league_format_id = await find_competition_format_id_by_code(
    "standard_league",
    competition_formats,
  );

  const world_cup_style_format_id = await find_competition_format_id_by_code(
    "world_cup_style",
    competition_formats,
  );

  const cup_tournament_format_id = await find_competition_format_id_by_code(
    "cup_tournament",
    competition_formats,
  );

  const single_round_robin_format_id = await find_competition_format_id_by_code(
    "single_round_robin",
    competition_formats,
  );

  const competition_format_ids: SeedCompetitionFormatIds = {
    easter_cup_format_id: world_cup_style_format_id,
    uganda_cup_format_id: cup_tournament_format_id,
    nhl_format_id: league_format_id,
    university_format_id: single_round_robin_format_id,
  };

  const seed_players = create_seed_players(
    position_ids,
    SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  );
  for (const player of seed_players) {
    await player_repository.seed_with_data([player]);
  }
  emit_entity_created_events(
    "player",
    seed_players,
    (p) => `${p.first_name} ${p.last_name}`,
  );

  const seed_venues = create_seed_venues(
    SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  );
  await venue_repository.seed_with_data(seed_venues);
  emit_entity_created_events("venue", seed_venues, (v) => v.name);

  const dragon_stadium_id = seed_venues[0]?.id || "";
  const thunder_arena_id = seed_venues[1]?.id || "";
  const eagle_nest_id = seed_venues[2]?.id || "";
  const storm_center_id = seed_venues[3]?.id || "";
  const international_hockey_arena_id = seed_venues[4]?.id || "";

  const seed_teams = create_seed_teams(
    dragon_stadium_id,
    thunder_arena_id,
    eagle_nest_id,
    storm_center_id,
    international_hockey_arena_id,
  );
  await team_repository.seed_with_data(seed_teams);
  emit_entity_created_events("team", seed_teams, (t) => t.name);

  const seed_staff = create_seed_team_staff(
    head_coach_role_id,
    assistant_coach_role_id,
    physio_role_id,
    team_manager_role_id,
  );
  await team_staff_repository.seed_with_data(seed_staff);
  emit_entity_created_events(
    "team_staff",
    seed_staff,
    (s) => `${s.first_name} ${s.last_name}`,
  );

  const seed_officials = create_seed_officials(
    SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  );
  await official_repository.seed_with_data(seed_officials);
  emit_entity_created_events(
    "official",
    seed_officials,
    (o) => `${o.first_name} ${o.last_name}`,
  );

  const seed_competitions = create_seed_competitions(competition_format_ids);
  await competition_repository.seed_with_data(seed_competitions);
  emit_entity_created_events("competition", seed_competitions, (c) => c.name);

  const competition_stage_repository =
    get_competition_stage_repository() as InBrowserCompetitionStageRepository;
  const seed_competition_stages = create_seed_competition_stages();
  await competition_stage_repository.seed_with_data(seed_competition_stages);
  emit_entity_created_events(
    "competition_stage",
    seed_competition_stages,
    (s) => `${s.name} (${s.competition_id})`,
  );

  const competition_team_repository =
    get_competition_team_repository() as InBrowserCompetitionTeamRepository;
  const seed_competition_teams = create_seed_competition_teams();
  await competition_team_repository.seed_with_data(seed_competition_teams);
  emit_entity_created_events(
    "competition_team",
    seed_competition_teams,
    (ct) => `Team ${ct.team_id} in Competition ${ct.competition_id}`,
  );

  const seed_memberships = create_seed_player_team_memberships();
  await player_team_membership_repository.seed_with_data(seed_memberships);
  emit_entity_created_events(
    "player_team_membership",
    seed_memberships,
    (m) => `Player ${m.player_id} -> Team ${m.team_id}`,
  );

  const seed_fixtures = create_seed_fixtures(
    referee_role_id,
    assistant_referee_role_id,
  );
  await fixture_repository.seed_with_data(seed_fixtures);
  emit_entity_created_events(
    "fixture",
    seed_fixtures,
    (f) => `${f.venue} - Round ${f.round_number}`,
  );

  const fixture_lineup_repository =
    get_fixture_lineup_repository() as InBrowserFixtureLineupRepository;
  const seed_lineups = create_seed_fixture_lineups();
  await fixture_lineup_repository.seed_with_data(seed_lineups);
  emit_entity_created_events(
    "fixture_lineup",
    seed_lineups,
    (l) => `Lineup for fixture ${l.fixture_id} - Team ${l.team_id}`,
  );

  const jersey_color_repository =
    get_jersey_color_repository() as InBrowserJerseyColorRepository;
  const seed_jersey_colors = create_seed_jersey_colors();
  await jersey_color_repository.seed_with_data(seed_jersey_colors);
  emit_entity_created_events(
    "jersey_color",
    seed_jersey_colors,
    (j) => `${j.nickname} (${j.main_color})`,
  );

  const identification_type_repository =
    get_identification_type_repository() as InBrowserIdentificationTypeRepository;
  const seed_identification_types = create_seed_identification_types();
  await identification_type_repository.seed_with_data(
    seed_identification_types,
  );
  emit_entity_created_events(
    "identificationtype",
    seed_identification_types,
    (t) => t.name,
  );

  const player_profile_repository =
    get_player_profile_repository() as InBrowserPlayerProfileRepository;
  const seed_player_profiles = create_seed_player_profiles();
  await player_profile_repository.seed_with_data(seed_player_profiles);
  emit_entity_created_events(
    "player_profile",
    seed_player_profiles,
    (p) => `Profile: ${p.profile_slug}`,
  );

  const team_profile_repository =
    get_team_profile_repository() as InBrowserTeamProfileRepository;
  const seed_team_profiles = create_seed_team_profiles();
  await team_profile_repository.seed_with_data(seed_team_profiles);
  emit_entity_created_events(
    "team_profile",
    seed_team_profiles,
    (p) => `Team Profile: ${p.profile_slug}`,
  );

  const profile_link_repository =
    get_profile_link_repository() as InBrowserProfileLinkRepository;
  const seed_player_profile_links = create_seed_profile_links();
  const seed_team_profile_links = create_seed_team_profile_links();
  const all_profile_links = [
    ...seed_player_profile_links,
    ...seed_team_profile_links,
  ];
  await profile_link_repository.seed_with_data(all_profile_links);
  emit_entity_created_events(
    "profile_link",
    all_profile_links,
    (l) => `Link: ${l.title}`,
  );

  await repair_seeded_competition_formats();
  await repair_seeded_fixture_stage_ids();
  clear_user_context();
  mark_seeding_complete();

  return true;
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
    await repair_seeded_competition_formats();
    await repair_seeded_fixture_stage_ids();
    await load_and_set_current_user();
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
    await repair_seeded_competition_formats();
    await repair_seeded_fixture_stage_ids();
    await load_and_set_current_user();
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
  const local_success = await seed_all_data_if_needed();

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
    await repair_seeded_competition_formats();
    await repair_seeded_fixture_stage_ids();
    await load_and_set_current_user();
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
    await repair_seeded_competition_formats();
    await repair_seeded_fixture_stage_ids();
    await load_and_set_current_user();
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
