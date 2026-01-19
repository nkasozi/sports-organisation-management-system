import { faker } from "@faker-js/faker";
import type { Organization } from "$lib/core/entities/Organization";
import type { Team } from "$lib/core/entities/Team";
import type { Player } from "$lib/core/entities/Player";
import type { Competition } from "$lib/core/entities/Competition";
import type { Official } from "$lib/core/entities/Official";
import type { Fixture, AssignedOfficial } from "$lib/core/entities/Fixture";
import type { Sport } from "$lib/core/entities/Sport";
import {
  create_field_hockey_sport_preset,
  create_football_sport_preset,
} from "$lib/core/entities/Sport";
import type { GameOfficialRole } from "$lib/core/entities/GameOfficialRole";
import type { TeamStaffRole } from "$lib/core/entities/TeamStaffRole";
import type { TeamStaff } from "$lib/core/entities/TeamStaff";
import type { CompetitionTeam } from "$lib/core/entities/CompetitionTeam";
import { get_default_football_official_roles } from "$lib/core/entities/GameOfficialRole";
import { get_default_team_staff_roles } from "$lib/core/entities/TeamStaffRole";

const FIRST_NAMES = [
  "James",
  "Michael",
  "David",
  "John",
  "Robert",
  "William",
  "Thomas",
  "Daniel",
  "Christopher",
  "Matthew",
  "Anthony",
  "Andrew",
  "Joshua",
  "Joseph",
  "Ryan",
  "Kevin",
  "Brian",
  "George",
  "Edward",
  "Marcus",
  "Sarah",
  "Emma",
  "Olivia",
  "Sophia",
  "Isabella",
  "Mia",
  "Charlotte",
  "Amelia",
  "Harper",
  "Evelyn",
];

const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Perez",
  "Thompson",
  "White",
  "Harris",
  "Sanchez",
  "Clark",
  "Ramirez",
  "Lewis",
  "Robinson",
];

const TEAM_NAMES = [
  "United",
  "City",
  "Athletic",
  "Sporting",
  "Real",
  "FC",
  "Olympic",
  "Dynamo",
  "Inter",
  "Metro",
  "Rangers",
  "Rovers",
  "Wanderers",
  "Albion",
  "Town",
];

const CITIES = [
  "Manchester",
  "Liverpool",
  "London",
  "Birmingham",
  "Leeds",
  "Newcastle",
  "Sheffield",
  "Bristol",
  "Nottingham",
  "Leicester",
  "Southampton",
  "Brighton",
  "Cardiff",
  "Edinburgh",
  "Glasgow",
  "Dublin",
  "Belfast",
  "Berlin",
  "Madrid",
  "Paris",
  "Milan",
  "Munich",
  "Amsterdam",
  "Lisbon",
  "Porto",
];

const POSITIONS = [
  "Goalkeeper",
  "Right Back",
  "Left Back",
  "Center Back",
  "Defensive Midfielder",
  "Central Midfielder",
  "Attacking Midfielder",
  "Right Winger",
  "Left Winger",
  "Striker",
  "Forward",
];

const NATIONALITIES = [
  "English",
  "Scottish",
  "Welsh",
  "Irish",
  "Spanish",
  "German",
  "French",
  "Italian",
  "Dutch",
  "Portuguese",
  "Brazilian",
  "Argentine",
  "Colombian",
  "Mexican",
  "American",
  "Canadian",
  "Japanese",
  "South Korean",
  "Australian",
];

function generate_id(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function random_element<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function random_date_between(start: Date, end: Date): string {
  const timestamp =
    start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(timestamp).toISOString().split("T")[0];
}

function generate_phone(): string {
  return `+44 ${faker.string.numeric(4)} ${faker.string.numeric(6)}`;
}

function generate_email(first_name: string, last_name: string): string {
  const domain = random_element([
    "gmail.com",
    "outlook.com",
    "yahoo.com",
    "sportmail.com",
  ]);
  return `${first_name.toLowerCase()}.${last_name.toLowerCase()}@${domain}`;
}

export function generate_game_official_roles(): GameOfficialRole[] {
  const now = new Date().toISOString();
  const default_roles = get_default_football_official_roles();

  return default_roles.map((role, index) => ({
    id: `gor_${index + 1}`,
    ...role,
    created_at: now,
    updated_at: now,
  }));
}

export function generate_team_staff_roles(): TeamStaffRole[] {
  const now = new Date().toISOString();
  const default_roles = get_default_team_staff_roles();

  return default_roles.map((role, index) => ({
    id: `tsr_${index + 1}`,
    ...role,
    created_at: now,
    updated_at: now,
  }));
}

export function generate_sport(): Sport {
  const now = new Date().toISOString();
  const sport_input = create_football_sport_preset();
  return {
    id: `sport_football_${generate_id()}`,
    ...sport_input,
    created_at: now,
    updated_at: now,
  };
}

export function generate_organization(sport_id: string): Organization {
  const city = random_element(CITIES);
  const now = new Date().toISOString();

  return {
    id: `org_${generate_id()}`,
    name: `${city} Sports Federation`,
    description: `Premier sports federation serving the ${city} metropolitan area.`,
    sport_id,
    founded_date: random_date_between(
      new Date(1900, 0, 1),
      new Date(2010, 0, 1),
    ),
    contact_email: `info@${city.toLowerCase()}sports.org`,
    contact_phone: generate_phone(),
    address: `${faker.location.streetAddress()}, ${city}`,
    website: `https://www.${city.toLowerCase()}sports.org`,
    status: "active",
    created_at: now,
    updated_at: now,
  };
}

export function generate_team(organization_id: string): Team {
  const city = random_element(CITIES);
  const suffix = random_element(TEAM_NAMES);
  const name = `${city} ${suffix}`;
  const now = new Date().toISOString();

  return {
    id: `team_${generate_id()}`,
    name,
    short_name: `${city.substring(0, 3).toUpperCase()}`,
    description: `Professional football club based in ${city}.`,
    organization_id,
    captain_player_id: null,
    vice_captain_player_id: null,
    max_squad_size: 25,
    home_venue_id: `venue-${faker.string.uuid()}`,
    primary_color: faker.color.rgb(),
    secondary_color: faker.color.rgb(),
    logo_url: "",
    website: `https://www.${city.toLowerCase()}${suffix.toLowerCase()}.com`,
    founded_year: faker.number.int({ min: 1880, max: 2015 }),
    status: "active",
    created_at: now,
    updated_at: now,
  };
}

export function generate_player(_team_id: string | null): Player {
  const first_name = random_element(FIRST_NAMES);
  const last_name = random_element(LAST_NAMES);
  const now = new Date().toISOString();

  return {
    id: `player_${generate_id()}`,
    first_name,
    last_name,
    email: generate_email(first_name, last_name),
    phone: generate_phone(),
    date_of_birth: random_date_between(
      new Date(1990, 0, 1),
      new Date(2005, 0, 1),
    ),
    position_id: "",
    height_cm: faker.number.int({ min: 165, max: 200 }),
    weight_kg: faker.number.int({ min: 60, max: 95 }),
    nationality: random_element(NATIONALITIES),
    profile_image_url: "",
    emergency_contact_name: `${random_element(FIRST_NAMES)} ${last_name}`,
    emergency_contact_phone: generate_phone(),
    medical_notes: "",
    status: "active",
    created_at: now,
    updated_at: now,
  };
}

export function generate_team_staff(
  team_id: string,
  role_id: string,
): TeamStaff {
  const first_name = random_element(FIRST_NAMES);
  const last_name = random_element(LAST_NAMES);
  const now = new Date().toISOString();

  return {
    id: `staff_${generate_id()}`,
    first_name,
    last_name,
    email: generate_email(first_name, last_name),
    phone: generate_phone(),
    date_of_birth: random_date_between(
      new Date(1960, 0, 1),
      new Date(1990, 0, 1),
    ),
    team_id,
    role_id,
    nationality: random_element(NATIONALITIES),
    profile_image_url: "",
    employment_start_date: random_date_between(
      new Date(2018, 0, 1),
      new Date(2023, 0, 1),
    ),
    employment_end_date: null,
    emergency_contact_name: `${random_element(FIRST_NAMES)} ${last_name}`,
    emergency_contact_phone: generate_phone(),
    notes: "",
    status: "active",
    created_at: now,
    updated_at: now,
  };
}

export function generate_official(
  organization_id: string,
  role_ids: string[],
): Official {
  const first_name = random_element(FIRST_NAMES);
  const last_name = random_element(LAST_NAMES);
  const now = new Date().toISOString();

  const primary_role_id = random_element(role_ids);

  return {
    id: `official_${generate_id()}`,
    first_name,
    last_name,
    email: generate_email(first_name, last_name),
    phone: generate_phone(),
    date_of_birth: random_date_between(
      new Date(1965, 0, 1),
      new Date(1995, 0, 1),
    ),
    organization_id,
    primary_role_id,
    years_of_experience: faker.number.int({ min: 1, max: 25 }),
    nationality: random_element(NATIONALITIES),
    profile_image_url: "",
    emergency_contact_name: `${random_element(FIRST_NAMES)} ${last_name}`,
    emergency_contact_phone: generate_phone(),
    notes: "",
    status: "active",
    created_at: now,
    updated_at: now,
  };
}

export function generate_competition(
  organization_id: string,
  competition_format_id: string = "",
): Competition {
  const city = random_element(CITIES);
  const comp_type = random_element([
    "Premier League",
    "Championship Cup",
    "Super League",
    "Elite Division",
  ]);
  const now = new Date().toISOString();
  const current_year = new Date().getFullYear();

  return {
    id: `comp_${generate_id()}`,
    name: `${city} ${comp_type}`,
    description: `Top-tier football competition for the ${current_year}/${current_year + 1} season.`,
    organization_id,
    start_date: `${current_year}-08-01`,
    end_date: `${current_year + 1}-05-31`,
    registration_deadline: `${current_year}-07-15`,
    max_teams: faker.number.int({ min: 8, max: 24 }),
    entry_fee: faker.number.int({ min: 100, max: 5000 }),
    prize_pool: faker.number.int({ min: 10000, max: 1000000 }),
    location: city,
    rule_overrides: {},
    status: "active",
    competition_format_id,
    team_ids: [],
    auto_generate_fixtures_and_assign_officials: false,
    created_at: now,
    updated_at: now,
  };
}

export function generate_competition_team(
  competition_id: string,
  team_id: string,
  seed_number: number | null = null,
): CompetitionTeam {
  const now = new Date().toISOString();

  return {
    id: `ct_${generate_id()}`,
    competition_id,
    team_id,
    registration_date: random_date_between(
      new Date(2024, 5, 1),
      new Date(2024, 7, 1),
    ),
    seed_number,
    group_name: null,
    points: 0,
    goals_for: 0,
    goals_against: 0,
    goal_difference: 0,
    matches_played: 0,
    matches_won: 0,
    matches_drawn: 0,
    matches_lost: 0,
    notes: "",
    status: "confirmed",
    created_at: now,
    updated_at: now,
  };
}

export function generate_fixture(
  competition_id: string,
  home_team_id: string,
  away_team_id: string,
  round_number: number,
  officials: Official[],
  official_roles: GameOfficialRole[],
): Fixture {
  const now = new Date().toISOString();
  const scheduled_date = new Date();
  scheduled_date.setDate(
    scheduled_date.getDate() + faker.number.int({ min: 1, max: 60 }),
  );

  const assigned_officials: AssignedOfficial[] = [];
  const referee_role = official_roles.find((r) => r.code === "REF");
  const ar_role = official_roles.find((r) => r.code === "AR");

  const shuffled_officials = [...officials].sort(() => Math.random() - 0.5);

  if (referee_role && shuffled_officials.length > 0) {
    assigned_officials.push({
      official_id: shuffled_officials[0].id,
      role_id: referee_role.id,
      role_name: referee_role.name,
    });
  }

  if (ar_role && shuffled_officials.length > 1) {
    assigned_officials.push({
      official_id: shuffled_officials[1].id,
      role_id: ar_role.id,
      role_name: ar_role.name,
    });
  }

  if (ar_role && shuffled_officials.length > 2) {
    assigned_officials.push({
      official_id: shuffled_officials[2].id,
      role_id: ar_role.id,
      role_name: ar_role.name,
    });
  }

  return {
    id: `fixture_${generate_id()}`,
    competition_id,
    round_number,
    round_name: `Round ${round_number}`,
    home_team_id,
    away_team_id,
    venue: `${random_element(CITIES)} Stadium`,
    scheduled_date: scheduled_date.toISOString().split("T")[0],
    scheduled_time: `${faker.number.int({ min: 12, max: 20 })}:${random_element(["00", "30"])}`,
    home_team_score: null,
    away_team_score: null,
    assigned_officials,
    game_events: [],
    current_period: "pre_game",
    current_minute: 0,
    match_day: round_number,
    notes: "",
    status: "scheduled",
    created_at: now,
    updated_at: now,
  };
}

export interface CompleteFakeDataSet {
  sport: Sport;
  organization: Organization;
  game_official_roles: GameOfficialRole[];
  team_staff_roles: TeamStaffRole[];
  teams: Team[];
  players: Player[];
  team_staff: TeamStaff[];
  officials: Official[];
  competition: Competition;
  competition_teams: CompetitionTeam[];
  fixtures: Fixture[];
}

export interface FieldHockeyDataSet extends CompleteFakeDataSet {
  sport: Sport;
}

export interface FieldHockeyDataSet extends CompleteFakeDataSet {
  sport: Sport;
}

export async function generate_field_hockey_dataset(
  num_teams: number = 6,
  players_per_team: number = 16,
): Promise<FieldHockeyDataSet> {
  const import_module =
    await import("../../adapters/repositories/InMemoryCompetitionFormatRepository");
  const format_repository = import_module.get_competition_format_repository();
  const formats_result = await format_repository.find_by_format_type("league");

  if (!formats_result || formats_result.length === 0) {
    throw new Error(
      "No league competition formats found. Please ensure competition formats are seeded.",
    );
  }

  const league_format = formats_result[0];

  const field_hockey_sport =
    create_field_hockey_sport_preset() as unknown as Sport;
  const now = new Date().toISOString();
  const sport_with_metadata = {
    ...field_hockey_sport,
    id: `sport_field_hockey_1`,
    created_at: now,
    updated_at: now,
  } as Sport;

  const fh_organization: Organization = {
    id: `org_fh_${generate_id()}`,
    name: "National Field Hockey Association",
    description:
      "Premier organization for field hockey competitions and development",
    sport_id: sport_with_metadata.id,
    founded_date: `1995-01-15`,
    contact_email: "info@fieldhockey.org",
    contact_phone: "+1-555-0100",
    address: "123 Hockey Lane, Sports City",
    website: "https://fieldhockey.org",
    status: "active",
    created_at: now,
    updated_at: now,
  };

  const game_official_roles = generate_game_official_roles();
  const team_staff_roles = generate_team_staff_roles();

  const teams: Team[] = [];
  const players: Player[] = [];
  const team_staff: TeamStaff[] = [];

  const fh_team_names = [
    "International Hawks",
    "Green Dragons",
    "Blue Waves",
    "Silver Strikers",
    "Golden Eagles",
    "Crimson Blades",
  ];

  for (let i = 0; i < Math.min(num_teams, fh_team_names.length); i++) {
    const team: Team = {
      id: `team_fh_${generate_id()}`,
      name: fh_team_names[i],
      short_name: fh_team_names[i].substring(0, 3).toUpperCase(),
      description: `Field Hockey Team - ${fh_team_names[i]}`,
      organization_id: fh_organization.id,
      captain_player_id: null,
      vice_captain_player_id: null,
      max_squad_size: 16,
      home_venue_id: `venue-${faker.string.uuid()}`,
      primary_color: faker.color.rgb(),
      secondary_color: faker.color.rgb(),
      logo_url: "",
      website: `https://www.${fh_team_names[i].toLowerCase().replace(/\s+/g, "")}.com`,
      founded_year: faker.number.int({ min: 1990, max: 2020 }),
      status: "active",
      created_at: now,
      updated_at: now,
    };
    teams.push(team);

    const team_players: Player[] = [];
    for (let j = 0; j < players_per_team; j++) {
      const player = generate_player(team.id);
      team_players.push(player);
      players.push(player);
    }

    if (team_players.length >= 2) {
      team.captain_player_id = team_players[0].id;
      team.vice_captain_player_id = team_players[1].id;
    }

    const coach_role = team_staff_roles.find((r) => r.code === "HC");
    const asst_coach_role = team_staff_roles.find((r) => r.code === "AC");
    const physio_role = team_staff_roles.find((r) => r.code === "PHYSIO");

    if (coach_role) {
      team_staff.push(generate_team_staff(team.id, coach_role.id));
    }
    if (asst_coach_role) {
      team_staff.push(generate_team_staff(team.id, asst_coach_role.id));
    }
    if (physio_role && Math.random() > 0.3) {
      team_staff.push(generate_team_staff(team.id, physio_role.id));
    }
  }

  const role_ids = game_official_roles.map((r) => r.id);
  const officials: Official[] = [];
  for (let i = 0; i < 12; i++) {
    officials.push(generate_official(fh_organization.id, role_ids));
  }

  const competition: Competition = {
    id: `comp_fh_${generate_id()}`,
    name: "International Field Hockey Championship",
    description: "Premier field hockey competition featuring top teams",
    organization_id: fh_organization.id,
    start_date: `${new Date().getFullYear()}-09-01`,
    end_date: `${new Date().getFullYear()}-11-30`,
    registration_deadline: `${new Date().getFullYear()}-08-15`,
    max_teams: num_teams,
    entry_fee: 2500,
    prize_pool: 50000,
    location: "International Stadium",
    rule_overrides: {},
    status: "active",
    competition_format_id: league_format.id,
    team_ids: teams.map((t) => t.id),
    auto_generate_fixtures_and_assign_officials: true,
    created_at: now,
    updated_at: now,
  };

  const competition_teams: CompetitionTeam[] = teams.map((team, index) =>
    generate_competition_team(competition.id, team.id, index + 1),
  );

  const fixtures: Fixture[] = [];
  for (
    let round = 1;
    round <= Math.min(3, Math.floor(teams.length / 2));
    round++
  ) {
    for (let match = 0; match < Math.floor(teams.length / 2); match++) {
      const home_index = match * 2;
      const away_index = match * 2 + 1;

      if (home_index < teams.length && away_index < teams.length) {
        fixtures.push(
          generate_fixture(
            competition.id,
            teams[home_index].id,
            teams[away_index].id,
            round,
            officials,
            game_official_roles,
          ),
        );
      }
    }
  }

  return {
    sport: sport_with_metadata,
    organization: fh_organization,
    game_official_roles,
    team_staff_roles,
    teams,
    players,
    team_staff,
    officials,
    competition,
    competition_teams,
    fixtures,
  };
}

export async function generate_complete_fake_dataset(
  num_teams: number = 8,
  players_per_team: number = 18,
): Promise<CompleteFakeDataSet> {
  const import_module =
    await import("../../adapters/repositories/InMemoryCompetitionFormatRepository");
  const format_repository = import_module.get_competition_format_repository();
  const formats_result = await format_repository.find_by_format_type("league");

  if (!formats_result || formats_result.length === 0) {
    throw new Error(
      "No league competition formats found. Please ensure competition formats are seeded.",
    );
  }

  const league_format = formats_result[0];

  const sport = generate_sport();
  const organization = generate_organization(sport.id);
  const game_official_roles = generate_game_official_roles();
  const team_staff_roles = generate_team_staff_roles();

  const teams: Team[] = [];
  const players: Player[] = [];
  const team_staff: TeamStaff[] = [];

  for (let i = 0; i < num_teams; i++) {
    const team = generate_team(organization.id);
    teams.push(team);

    const team_players: Player[] = [];
    for (let j = 0; j < players_per_team; j++) {
      const player = generate_player(team.id);
      team_players.push(player);
      players.push(player);
    }

    if (team_players.length >= 2) {
      team.captain_player_id = team_players[0].id;
      team.vice_captain_player_id = team_players[1].id;
    }

    const coach_role = team_staff_roles.find((r) => r.code === "HC");
    const asst_coach_role = team_staff_roles.find((r) => r.code === "AC");
    const physio_role = team_staff_roles.find((r) => r.code === "PHYSIO");

    if (coach_role) {
      team_staff.push(generate_team_staff(team.id, coach_role.id));
    }
    if (asst_coach_role) {
      team_staff.push(generate_team_staff(team.id, asst_coach_role.id));
    }
    if (physio_role && Math.random() > 0.3) {
      team_staff.push(generate_team_staff(team.id, physio_role.id));
    }
  }

  const role_ids = game_official_roles.map((r) => r.id);
  const officials: Official[] = [];
  for (let i = 0; i < 15; i++) {
    officials.push(generate_official(organization.id, role_ids));
  }

  const competition = generate_competition(organization.id, league_format.id);

  const competition_teams: CompetitionTeam[] = teams.map((team, index) =>
    generate_competition_team(competition.id, team.id, index + 1),
  );

  const fixtures: Fixture[] = [];
  for (
    let round = 1;
    round <= Math.min(4, Math.floor(teams.length / 2));
    round++
  ) {
    for (let match = 0; match < Math.floor(teams.length / 2); match++) {
      const home_index = match * 2;
      const away_index = match * 2 + 1;

      if (home_index < teams.length && away_index < teams.length) {
        fixtures.push(
          generate_fixture(
            competition.id,
            teams[home_index].id,
            teams[away_index].id,
            round,
            officials,
            game_official_roles,
          ),
        );
      }
    }
  }

  return {
    sport,
    organization,
    game_official_roles,
    team_staff_roles,
    teams,
    players,
    team_staff,
    officials,
    competition,
    competition_teams,
    fixtures,
  };
}

export function log_dataset_summary(dataset: CompleteFakeDataSet): void {
  console.log("Generated Fake Data Summary:");
  console.log(`  Sport: ${dataset.sport.name}`);
  console.log(`  Organization: ${dataset.organization.name}`);
  console.log(`  Game Official Roles: ${dataset.game_official_roles.length}`);
  console.log(`  Team Staff Roles: ${dataset.team_staff_roles.length}`);
  console.log(`  Teams: ${dataset.teams.length}`);
  console.log(`  Players: ${dataset.players.length}`);
  console.log(`  Team Staff: ${dataset.team_staff.length}`);
  console.log(`  Officials: ${dataset.officials.length}`);
  console.log(`  Competition: ${dataset.competition.name}`);
  console.log(`  Competition Teams: ${dataset.competition_teams.length}`);
  console.log(`  Fixtures: ${dataset.fixtures.length}`);
}
