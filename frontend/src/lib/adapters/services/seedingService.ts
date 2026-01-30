import { get_player_position_repository } from "../repositories/InMemoryPlayerPositionRepository";
import { get_team_staff_role_repository } from "../repositories/InMemoryTeamStaffRoleRepository";
import { get_game_official_role_repository } from "../repositories/InMemoryGameOfficialRoleRepository";
import { get_competition_format_repository } from "../repositories/InMemoryCompetitionFormatRepository";
import {
  get_player_repository,
  InMemoryPlayerRepository,
} from "../repositories/InMemoryPlayerRepository";
import {
  get_team_repository,
  InMemoryTeamRepository,
} from "../repositories/InMemoryTeamRepository";
import {
  get_team_staff_repository,
  InMemoryTeamStaffRepository,
} from "../repositories/InMemoryTeamStaffRepository";
import {
  get_official_repository,
  InMemoryOfficialRepository,
} from "../repositories/InMemoryOfficialRepository";
import {
  get_competition_repository,
  InMemoryCompetitionRepository,
} from "../repositories/InMemoryCompetitionRepository";
import {
  get_competition_team_repository,
  InMemoryCompetitionTeamRepository,
} from "../repositories/InMemoryCompetitionTeamRepository";
import {
  get_player_team_membership_repository,
  InMemoryPlayerTeamMembershipRepository,
} from "../repositories/InMemoryPlayerTeamMembershipRepository";
import {
  get_fixture_repository,
  InMemoryFixtureRepository,
} from "../repositories/InMemoryFixtureRepository";
import {
  get_venue_repository,
  InMemoryVenueRepository,
} from "../repositories/InMemoryVenueRepository";
import {
  get_jersey_color_repository,
  InMemoryJerseyColorRepository,
} from "../repositories/InMemoryJerseyColorRepository";
import {
  get_player_profile_repository,
  InMemoryPlayerProfileRepository,
} from "../repositories/InMemoryPlayerProfileRepository";
import {
  get_profile_link_repository,
  InMemoryProfileLinkRepository,
} from "../repositories/InMemoryProfileLinkRepository";
import {
  get_team_profile_repository,
  InMemoryTeamProfileRepository,
} from "../repositories/InMemoryTeamProfileRepository";
import { get_repository_container } from "../../infrastructure/container";
import {
  create_seed_players,
  create_seed_teams,
  create_seed_team_staff,
  create_seed_competitions,
  create_seed_competition_teams,
  create_seed_player_team_memberships,
  create_seed_officials,
  create_seed_fixtures,
  create_seed_venues,
  create_seed_jersey_colors,
  create_seed_player_profiles,
  create_seed_profile_links,
  create_seed_team_profiles,
  create_seed_team_profile_links,
  create_seed_system_users,
  SEED_ORGANIZATION_IDS,
  SEED_SYSTEM_USER_IDS,
} from "../../infrastructure/utils/SeedDataGenerator";
import type { PlayerPosition } from "../../core/entities/PlayerPosition";
import type { TeamStaffRole } from "../../core/entities/TeamStaffRole";
import type { GameOfficialRole } from "../../core/entities/GameOfficialRole";
import type { CompetitionFormat } from "../../core/entities/CompetitionFormat";
import {
  EventBus,
  set_user_context,
  clear_user_context,
} from "../../infrastructure/events/EventBus";
import type { SystemUser } from "../../core/entities/SystemUser";
import { current_user_store } from "../../presentation/stores/currentUser";

const SEEDING_COMPLETE_KEY = "sports_org_seeding_complete_v6";

export function is_seeding_already_complete(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(SEEDING_COMPLETE_KEY) === "true";
}

function mark_seeding_complete(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SEEDING_COMPLETE_KEY, "true");
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
    });

    current_user_store.set_user(admin_result.data);
    return admin_result.data;
  }

  const existing_users_result = await system_user_repository.find_all({
    page_size: 100,
  });

  if (!existing_users_result.success) return null;

  const super_admin = existing_users_result.data.items.find(
    (user) => user.role === "super_admin",
  );

  if (!super_admin) return null;

  set_user_context({
    user_id: super_admin.id,
    user_email: super_admin.email,
    user_display_name: `${super_admin.first_name} ${super_admin.last_name}`,
  });

  current_user_store.set_user(super_admin);

  return super_admin;
}

function seed_super_admin_user(): SystemUser | null {
  const container = get_repository_container();
  const system_user_repository = container.system_user_repository;

  const seed_users = create_seed_system_users();
  system_user_repository.seed_with_data(seed_users);

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
    await load_and_set_current_user();
    return true;
  }
  if (typeof window === "undefined") return false;

  const super_admin = seed_super_admin_user();

  if (!super_admin) {
    console.error("[SEED] Failed to create super admin, aborting seeding");
    return false;
  }

  set_user_context({
    user_id: super_admin.id,
    user_email: super_admin.email,
    user_display_name: `${super_admin.first_name} ${super_admin.last_name}`,
  });

  current_user_store.set_user(super_admin);

  EventBus.emit_entity_created(
    "system_user",
    super_admin.id,
    `${super_admin.first_name} ${super_admin.last_name}`,
    super_admin as unknown as Record<string, unknown>,
  );

  const player_position_repository = get_player_position_repository();
  const team_staff_role_repository = get_team_staff_role_repository();
  const official_role_repository = get_game_official_role_repository();
  const competition_format_repository = get_competition_format_repository();
  const player_repository = get_player_repository() as InMemoryPlayerRepository;
  const team_repository = get_team_repository() as InMemoryTeamRepository;
  const team_staff_repository =
    get_team_staff_repository() as InMemoryTeamStaffRepository;
  const official_repository =
    get_official_repository() as InMemoryOfficialRepository;
  const competition_repository =
    get_competition_repository() as InMemoryCompetitionRepository;
  const player_team_membership_repository =
    get_player_team_membership_repository() as InMemoryPlayerTeamMembershipRepository;
  const fixture_repository =
    get_fixture_repository() as InMemoryFixtureRepository;
  const venue_repository = get_venue_repository() as InMemoryVenueRepository;

  const positions_result = await player_position_repository.find_all({
    page_size: 100,
  });
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
    await competition_format_repository.find_all({ page_size: 100 });
  const competition_formats = competition_formats_result.success
    ? competition_formats_result.data.items
    : [];

  const goalkeeper_position_id = await find_position_id_by_code(
    "GK",
    positions,
  );
  const defender_position_id = await find_position_id_by_code("CB", positions);
  const midfielder_position_id = await find_position_id_by_code(
    "CM",
    positions,
  );
  const forward_position_id = await find_position_id_by_code("ST", positions);

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

  const existing_players = await player_repository.find_all({ page_size: 1 });
  if (!existing_players.success || existing_players.data.total_count === 0) {
    const seed_players = create_seed_players(
      goalkeeper_position_id,
      defender_position_id,
      midfielder_position_id || defender_position_id,
      forward_position_id || defender_position_id,
    );
    for (const player of seed_players) {
      player_repository.seed_with_data([player]);
    }
    emit_entity_created_events(
      "player",
      seed_players,
      (p) => `${p.first_name} ${p.last_name}`,
    );
  }

  const existing_venues = await venue_repository.find_all({ page_size: 1 });
  let venue_ids: string[] = [];
  let seeded_venues: {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
  }[] = [];
  if (!existing_venues.success || existing_venues.data.total_count === 0) {
    const seed_venues = create_seed_venues();
    for (const venue_input of seed_venues) {
      const create_result = await venue_repository.create(venue_input);
      if (create_result.success && create_result.data) {
        venue_ids.push(create_result.data.id);
        seeded_venues.push(create_result.data);
      }
    }
    emit_entity_created_events("venue", seeded_venues, (v) => v.name);
  } else {
    const all_venues_result = await venue_repository.find_all({
      page_size: 100,
    });
    if (all_venues_result.success) {
      venue_ids = all_venues_result.data.items.map((v) => v.id);
    }
  }

  const existing_teams = await team_repository.find_all({ page_size: 1 });
  if (!existing_teams.success || existing_teams.data.total_count === 0) {
    const dragon_stadium_id = venue_ids[0] || "";
    const thunder_arena_id = venue_ids[1] || "";
    const eagle_nest_id = venue_ids[2] || "";
    const storm_center_id = venue_ids[3] || "";
    const international_hockey_arena_id = venue_ids[4] || "";

    const seed_teams = create_seed_teams(
      dragon_stadium_id,
      thunder_arena_id,
      eagle_nest_id,
      storm_center_id,
      international_hockey_arena_id,
    );
    team_repository.seed_with_data(seed_teams);
    emit_entity_created_events("team", seed_teams, (t) => t.name);
  }

  const existing_staff = await team_staff_repository.find_all_with_filter(
    undefined,
    { page_size: 1 },
  );
  if (!existing_staff.success || existing_staff.data.total_count === 0) {
    const seed_staff = create_seed_team_staff(
      head_coach_role_id,
      assistant_coach_role_id,
      physio_role_id,
      team_manager_role_id,
    );
    team_staff_repository.seed_with_data(seed_staff);
    emit_entity_created_events(
      "team_staff",
      seed_staff,
      (s) => `${s.first_name} ${s.last_name}`,
    );
  }

  const existing_officials = await official_repository.find_all({
    page_size: 1,
  });
  if (
    !existing_officials.success ||
    existing_officials.data.total_count === 0
  ) {
    const seed_officials = create_seed_officials(
      SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
    );
    official_repository.seed_with_data(seed_officials);
    emit_entity_created_events(
      "official",
      seed_officials,
      (o) => `${o.first_name} ${o.last_name}`,
    );
  }

  const existing_competitions = await competition_repository.find_all({
    page_size: 1,
  });
  if (
    !existing_competitions.success ||
    existing_competitions.data.total_count === 0
  ) {
    const seed_competitions = create_seed_competitions(league_format_id);
    competition_repository.seed_with_data(seed_competitions);
    emit_entity_created_events("competition", seed_competitions, (c) => c.name);
  }

  const competition_team_repository =
    get_competition_team_repository() as InMemoryCompetitionTeamRepository;
  const existing_competition_teams = await competition_team_repository.find_all(
    { page_size: 1 },
  );
  if (
    !existing_competition_teams.success ||
    existing_competition_teams.data.total_count === 0
  ) {
    const seed_competition_teams = create_seed_competition_teams();
    competition_team_repository.seed_with_data(seed_competition_teams);
    emit_entity_created_events(
      "competition_team",
      seed_competition_teams,
      (ct) => `Team ${ct.team_id} in Competition ${ct.competition_id}`,
    );
  }

  const existing_memberships = await player_team_membership_repository.find_all(
    { page_size: 1 },
  );
  if (
    !existing_memberships.success ||
    existing_memberships.data.total_count === 0
  ) {
    const seed_memberships = create_seed_player_team_memberships();
    player_team_membership_repository.seed_with_data(seed_memberships);
    emit_entity_created_events(
      "player_team_membership",
      seed_memberships,
      (m) => `Player ${m.player_id} -> Team ${m.team_id}`,
    );
  }

  const existing_fixtures = await fixture_repository.find_all({ page_size: 1 });
  if (!existing_fixtures.success || existing_fixtures.data.total_count === 0) {
    const seed_fixtures = create_seed_fixtures(
      referee_role_id,
      assistant_referee_role_id,
    );
    fixture_repository.seed_with_data(seed_fixtures);
    emit_entity_created_events(
      "fixture",
      seed_fixtures,
      (f) => `${f.venue} - Round ${f.round_number}`,
    );
  }

  const jersey_color_repository =
    get_jersey_color_repository() as InMemoryJerseyColorRepository;
  const existing_jersey_colors = await jersey_color_repository.find_all({
    page_size: 1,
  });
  if (
    !existing_jersey_colors.success ||
    existing_jersey_colors.data.total_count === 0
  ) {
    const seed_jersey_colors = create_seed_jersey_colors();
    jersey_color_repository.seed_with_data(seed_jersey_colors);
    emit_entity_created_events(
      "jersey_color",
      seed_jersey_colors,
      (j) => `${j.nickname} (${j.main_color})`,
    );
  }

  const player_profile_repository =
    get_player_profile_repository() as InMemoryPlayerProfileRepository;
  const existing_player_profiles = await player_profile_repository.find_all({
    page_size: 1,
  });
  if (
    !existing_player_profiles.success ||
    existing_player_profiles.data.total_count === 0
  ) {
    const seed_player_profiles = create_seed_player_profiles();
    player_profile_repository.seed_with_data(seed_player_profiles);
    emit_entity_created_events(
      "player_profile",
      seed_player_profiles,
      (p) => `Profile: ${p.profile_slug}`,
    );
  }

  const team_profile_repository =
    get_team_profile_repository() as InMemoryTeamProfileRepository;
  const existing_team_profiles = await team_profile_repository.find_all({
    page_size: 1,
  });
  if (
    !existing_team_profiles.success ||
    existing_team_profiles.data.total_count === 0
  ) {
    const seed_team_profiles = create_seed_team_profiles();
    team_profile_repository.seed_with_data(seed_team_profiles);
    emit_entity_created_events(
      "team_profile",
      seed_team_profiles,
      (p) => `Team Profile: ${p.profile_slug}`,
    );
  }

  const profile_link_repository =
    get_profile_link_repository() as InMemoryProfileLinkRepository;
  const existing_profile_links = await profile_link_repository.find_all({
    page_size: 1,
  });
  if (
    !existing_profile_links.success ||
    existing_profile_links.data.total_count === 0
  ) {
    const seed_player_profile_links = create_seed_profile_links();
    const seed_team_profile_links = create_seed_team_profile_links();
    const all_profile_links = [
      ...seed_player_profile_links,
      ...seed_team_profile_links,
    ];
    profile_link_repository.seed_with_data(all_profile_links);
    emit_entity_created_events(
      "profile_link",
      all_profile_links,
      (l) => `Link: ${l.title}`,
    );
  }

  clear_user_context();
  mark_seeding_complete();

  return true;
}

export function reset_seeding_flag(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SEEDING_COMPLETE_KEY);
}
