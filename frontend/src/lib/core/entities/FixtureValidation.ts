import type {
  AssignedOfficial,
  CreateFixtureInput,
  Fixture,
} from "./FixtureTypes";
import type { OfficialRequirement } from "./Sport";

function create_empty_fixture_input(
  organization_id: CreateFixtureInput["organization_id"] = "",
  competition_id: CreateFixtureInput["competition_id"] = "",
): CreateFixtureInput {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return {
    organization_id,
    competition_id,
    round_number: 1,
    round_name: "Round 1",
    home_team_id: "",
    away_team_id: "",
    venue: "",
    scheduled_date: tomorrow.toISOString().split("T")[0],
    scheduled_time: "15:00",
    assigned_officials: [],
    match_day: 1,
    notes: "",
    stage_id: "",
    status: "scheduled",
  };
}

export function validate_fixture_input(input: CreateFixtureInput): string[] {
  const validation_errors: string[] = [];

  if (!input.competition_id) {
    validation_errors.push("Competition is required");
  }
  if (!input.home_team_id) {
    validation_errors.push("Home team is required");
  }
  if (!input.away_team_id) {
    validation_errors.push("Away team is required");
  }
  if (
    input.home_team_id &&
    input.away_team_id &&
    input.home_team_id === input.away_team_id
  ) {
    validation_errors.push("Home and away teams must be different");
  }
  if (!input.scheduled_date) {
    validation_errors.push("Scheduled date is required");
  }
  if (!input.scheduled_time) {
    validation_errors.push("Scheduled time is required");
  }
  if (input.round_number < 1) {
    validation_errors.push("Round number must be at least 1");
  }
  if (!input.stage_id || input.stage_id.trim().length === 0) {
    validation_errors.push("Stage is required");
  }

  return validation_errors;
}

function derive_groups_from_fixtures(
  fixtures: Pick<Fixture, "home_team_id" | "away_team_id">[],
): string[][] {
  const parent: Record<Fixture["home_team_id"], Fixture["home_team_id"]> = {};

  function find_root(
    team_id: Fixture["home_team_id"],
  ): Fixture["home_team_id"] {
    if (parent[team_id] === void 0) {
      parent[team_id] = team_id;
    }
    if (parent[team_id] !== team_id) {
      parent[team_id] = find_root(parent[team_id]);
    }
    return parent[team_id];
  }

  function union_teams(
    a: Fixture["home_team_id"],
    b: Fixture["away_team_id"],
  ): void {
    const root_a = find_root(a);
    const root_b = find_root(b);
    if (root_a !== root_b) {
      parent[root_b] = root_a;
    }
  }

  for (const fixture of fixtures) {
    union_teams(fixture.home_team_id, fixture.away_team_id);
  }

  const groups: Record<Fixture["home_team_id"], Fixture["home_team_id"][]> = {};
  for (const team_id of Object.keys(parent) as Fixture["home_team_id"][]) {
    const root = find_root(team_id);
    if (!groups[root]) {
      groups[root] = [];
    }
    groups[root].push(team_id);
  }

  return Object.values(groups).map((group) => group.sort());
}

interface OfficialValidationResult {
  is_valid: boolean;
  errors: OfficialValidationError[];
  warnings: OfficialValidationWarning[];
}

interface OfficialValidationError {
  role_id: OfficialRequirement["role_id"];
  role_name: OfficialRequirement["role_name"];
  required_count: number;
  assigned_count: number;
  message: string;
  rule_source: "sport" | "competition";
}

interface OfficialValidationWarning {
  role_id: OfficialRequirement["role_id"];
  role_name: OfficialRequirement["role_name"];
  message: string;
}

function validate_fixture_officials(
  assigned_officials: AssignedOfficial[],
  official_requirements: OfficialRequirement[],
  rule_source: "sport" | "competition" = "sport",
): OfficialValidationResult {
  const errors: OfficialValidationError[] = [];
  const warnings: OfficialValidationWarning[] = [];

  for (const requirement of official_requirements) {
    const assigned_for_role = assigned_officials.filter(
      (o) => o.role_id === requirement.role_id,
    );
    const assigned_count = assigned_for_role.length;

    if (
      requirement.is_mandatory &&
      assigned_count < requirement.minimum_count
    ) {
      errors.push({
        role_id: requirement.role_id,
        role_name: requirement.role_name,
        required_count: requirement.minimum_count,
        assigned_count,
        message: `${requirement.role_name}: Need at least ${requirement.minimum_count}, assigned ${assigned_count}`,
        rule_source,
      });
    }

    if (
      requirement.maximum_count > 0 &&
      assigned_count > requirement.maximum_count
    ) {
      warnings.push({
        role_id: requirement.role_id,
        role_name: requirement.role_name,
        message: `${requirement.role_name}: Maximum is ${requirement.maximum_count}, assigned ${assigned_count}`,
      });
    }
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
  };
}
