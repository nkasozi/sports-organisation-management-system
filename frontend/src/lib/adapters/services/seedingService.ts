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
  create_seed_players,
  create_seed_teams,
  create_seed_team_staff,
  create_seed_competitions,
  create_seed_player_team_memberships,
  create_seed_officials,
  create_seed_fixtures,
  create_seed_venues,
  SEED_ORGANIZATION_IDS,
} from "../../infrastructure/utils/SeedDataGenerator";
import type { PlayerPosition } from "../../core/entities/PlayerPosition";
import type { TeamStaffRole } from "../../core/entities/TeamStaffRole";
import type { GameOfficialRole } from "../../core/entities/GameOfficialRole";
import type { CompetitionFormat } from "../../core/entities/CompetitionFormat";

const SEEDING_COMPLETE_KEY = "sports_org_seeding_complete_v2";

function is_seeding_already_complete(): boolean {
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

export async function seed_all_data_if_needed(): Promise<boolean> {
  if (is_seeding_already_complete()) return true;
  if (typeof window === "undefined") return false;

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
  }

  const existing_venues = await venue_repository.find_all({ page_size: 1 });
  let venue_ids: string[] = [];
  if (!existing_venues.success || existing_venues.data.total_count === 0) {
    const seed_venues = create_seed_venues();
    for (const venue_input of seed_venues) {
      const create_result = await venue_repository.create(venue_input);
      if (create_result.success && create_result.data) {
        venue_ids.push(create_result.data.id);
      }
    }
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
  }

  const existing_officials = await official_repository.find_all({
    page_size: 1,
  });
  console.log("[SEED] Checking officials:", {
    success: existing_officials.success,
    count: existing_officials.success ? existing_officials.data.total_count : 0,
  });
  if (
    !existing_officials.success ||
    existing_officials.data.total_count === 0
  ) {
    const seed_officials = create_seed_officials(
      SEED_ORGANIZATION_IDS.CITY_FOOTBALL_LEAGUE,
      referee_role_id,
    );
    console.log(
      "[SEED] Seeding officials:",
      seed_officials.length,
      "officials",
    );
    official_repository.seed_with_data(seed_officials);
    console.log("[SEED] Officials seeded successfully");
  } else {
    console.log("[SEED] Officials already exist, skipping seeding");
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
  }

  const existing_fixtures = await fixture_repository.find_all({ page_size: 1 });
  if (!existing_fixtures.success || existing_fixtures.data.total_count === 0) {
    const seed_fixtures = create_seed_fixtures(
      referee_role_id,
      assistant_referee_role_id,
    );
    fixture_repository.seed_with_data(seed_fixtures);
  }

  mark_seeding_complete();

  const officials_in_storage = localStorage.getItem("sports_org_officials");
  if (officials_in_storage) {
    const officials_data = JSON.parse(officials_in_storage);
    console.log(
      "[SEED] ✅ Officials in localStorage:",
      Object.keys(officials_data).length,
      "officials",
    );
    localStorage.setItem(
      "debug_officials_count",
      Object.keys(officials_data).length.toString(),
    );
  } else {
    console.log("[SEED] ❌ NO officials in localStorage!");
    localStorage.setItem("debug_officials_count", "0");
  }

  return true;
}

export function reset_seeding_flag(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SEEDING_COMPLETE_KEY);
}
