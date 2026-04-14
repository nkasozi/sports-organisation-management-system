import type { CreateFixtureInput } from "./FixtureTypes";

const BYE_TEAM_IDENTIFIER = "BYE";

type FixtureGenerationTeamIdentifier =
  | CreateFixtureInput["home_team_id"]
  | typeof BYE_TEAM_IDENTIFIER;

export interface FixtureGenerationConfig {
  organization_id: CreateFixtureInput["organization_id"];
  competition_id: CreateFixtureInput["competition_id"];
  team_ids: Array<CreateFixtureInput["home_team_id"]>;
  start_date: CreateFixtureInput["scheduled_date"];
  match_days_per_week: number[];
  default_time: CreateFixtureInput["scheduled_time"];
  venue_rotation: "home_away" | "neutral" | "single_venue";
  single_venue?: CreateFixtureInput["venue"];
  rounds: number;
  stage_id_per_round: Record<number, CreateFixtureInput["stage_id"]>;
}

export function generate_round_robin_fixtures(
  config: FixtureGenerationConfig,
): CreateFixtureInput[] {
  const fixtures: CreateFixtureInput[] = [];
  const teams: FixtureGenerationTeamIdentifier[] = [...config.team_ids];

  if (teams.length % 2 !== 0) {
    teams.push(BYE_TEAM_IDENTIFIER);
  }

  const total_teams = teams.length;
  const total_rounds = (total_teams - 1) * config.rounds;

  let current_date = new Date(config.start_date);
  let match_day = 1;

  for (let round = 0; round < total_rounds; round++) {
    const round_number = round + 1;
    const is_reverse = round >= total_teams - 1;

    for (let match = 0; match < total_teams / 2; match++) {
      const home_index = match;
      const away_index = total_teams - 1 - match;

      let home_team = teams[home_index];
      let away_team = teams[away_index];

      if (is_reverse) {
        [home_team, away_team] = [away_team, home_team];
      }

      if (
        home_team === BYE_TEAM_IDENTIFIER ||
        away_team === BYE_TEAM_IDENTIFIER
      ) {
        continue;
      }

      const venue =
        config.venue_rotation === "single_venue" && config.single_venue
          ? config.single_venue
          : "";

      fixtures.push({
        organization_id: config.organization_id,
        competition_id: config.competition_id,
        round_number,
        round_name: `Round ${round_number}`,
        home_team_id: home_team,
        away_team_id: away_team,
        venue,
        scheduled_date: current_date.toISOString().split("T")[0],
        scheduled_time: config.default_time,
        assigned_officials: [],
        match_day,
        notes: "",
        stage_id: config.stage_id_per_round[round_number] ?? "",
        status: "scheduled",
      });
    }

    const first_team = teams[0];
    const last_team = teams.pop()!;
    teams.splice(1, 0, last_team);
    teams[0] = first_team;

    current_date.setDate(current_date.getDate() + 7);
    match_day++;
  }

  return fixtures;
}

const FIXTURE_STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "postponed", label: "Postponed" },
  { value: "cancelled", label: "Cancelled" },
];
