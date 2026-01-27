import type { BaseEntity } from "./BaseEntity";
import type { OfficialRequirement } from "./Sport";

export type FixtureStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "postponed"
  | "cancelled";

export type GamePeriod =
  | "pre_game"
  | "first_half"
  | "half_time"
  | "second_half"
  | "extra_time_first"
  | "extra_time_second"
  | "penalty_shootout"
  | "finished";

export type GameEventType =
  | "goal"
  | "own_goal"
  | "penalty_scored"
  | "penalty_missed"
  | "yellow_card"
  | "red_card"
  | "second_yellow"
  | "substitution"
  | "foul"
  | "offside"
  | "corner"
  | "free_kick"
  | "injury"
  | "var_review"
  | "period_start"
  | "period_end";

export interface GameEvent {
  id: string;
  event_type: GameEventType;
  minute: number;
  stoppage_time_minute: number | null;
  team_side: "home" | "away" | "match";
  player_name: string;
  secondary_player_name: string;
  description: string;
  recorded_at: string;
}

export interface AssignedOfficial {
  official_id: string;
  role_id: string;
  role_name: string;
}

export interface JerseyColorAssignment {
  jersey_color_id: string;
  main_color: string;
  nickname: string;
}

export interface Fixture extends BaseEntity {
  competition_id: string;
  round_number: number;
  round_name: string;
  home_team_id: string;
  away_team_id: string;
  venue: string;
  scheduled_date: string;
  scheduled_time: string;
  home_team_score: number | null;
  away_team_score: number | null;
  assigned_officials: AssignedOfficial[];
  game_events: GameEvent[];
  current_period: GamePeriod;
  current_minute: number;
  match_day: number;
  notes: string;
  status: FixtureStatus;
  home_team_name?: string;
  away_team_name?: string;
  home_team_jersey?: JerseyColorAssignment;
  away_team_jersey?: JerseyColorAssignment;
  officials_jersey?: JerseyColorAssignment;
}

export type CreateFixtureInput = Omit<
  Fixture,
  | "id"
  | "created_at"
  | "updated_at"
  | "home_team_score"
  | "away_team_score"
  | "game_events"
  | "current_period"
  | "current_minute"
>;
export type UpdateFixtureInput = Partial<
  Omit<Fixture, "id" | "created_at" | "updated_at">
>;

export function create_empty_fixture_input(
  competition_id: string = "",
): CreateFixtureInput {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return {
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

  return validation_errors;
}

export interface OfficialValidationResult {
  is_valid: boolean;
  errors: OfficialValidationError[];
  warnings: OfficialValidationWarning[];
}

export interface OfficialValidationError {
  role_id: string;
  role_name: string;
  required_count: number;
  assigned_count: number;
  message: string;
  rule_source: "sport" | "competition";
}

export interface OfficialValidationWarning {
  role_id: string;
  role_name: string;
  message: string;
}

export function validate_fixture_officials(
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

export interface FixtureGenerationConfig {
  competition_id: string;
  team_ids: string[];
  start_date: string;
  match_days_per_week: number[];
  default_time: string;
  venue_rotation: "home_away" | "neutral" | "single_venue";
  single_venue?: string;
  rounds: number;
}

export function generate_round_robin_fixtures(
  config: FixtureGenerationConfig,
): CreateFixtureInput[] {
  const fixtures: CreateFixtureInput[] = [];
  const teams = [...config.team_ids];

  if (teams.length % 2 !== 0) {
    teams.push("BYE");
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

      if (home_team === "BYE" || away_team === "BYE") {
        continue;
      }

      const venue =
        config.venue_rotation === "single_venue" && config.single_venue
          ? config.single_venue
          : "";

      fixtures.push({
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

export const FIXTURE_STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "postponed", label: "Postponed" },
  { value: "cancelled", label: "Cancelled" },
];

export interface QuickEventButton {
  id: GameEventType;
  label: string;
  icon: string;
  color: string;
  affects_score: boolean;
  requires_player: boolean;
}

export function get_quick_event_buttons(): QuickEventButton[] {
  return [
    {
      id: "goal",
      label: "Goal",
      icon: "⚽",
      color: "bg-green-500 hover:bg-green-600",
      affects_score: true,
      requires_player: true,
    },
    {
      id: "own_goal",
      label: "Own Goal",
      icon: "🥅",
      color: "bg-orange-500 hover:bg-orange-600",
      affects_score: true,
      requires_player: true,
    },
    {
      id: "penalty_scored",
      label: "Penalty ✓",
      icon: "🎯",
      color: "bg-green-600 hover:bg-green-700",
      affects_score: true,
      requires_player: true,
    },
    {
      id: "penalty_missed",
      label: "Penalty ✗",
      icon: "❌",
      color: "bg-red-400 hover:bg-red-500",
      affects_score: false,
      requires_player: true,
    },
    {
      id: "yellow_card",
      label: "Yellow",
      icon: "🟨",
      color: "bg-yellow-400 hover:bg-yellow-500",
      affects_score: false,
      requires_player: true,
    },
    {
      id: "red_card",
      label: "Red",
      icon: "🟥",
      color: "bg-red-600 hover:bg-red-700",
      affects_score: false,
      requires_player: true,
    },
    {
      id: "second_yellow",
      label: "2nd Yellow",
      icon: "🟨🟥",
      color: "bg-orange-600 hover:bg-orange-700",
      affects_score: false,
      requires_player: true,
    },
    {
      id: "substitution",
      label: "Sub",
      icon: "🔄",
      color: "bg-blue-500 hover:bg-blue-600",
      affects_score: false,
      requires_player: true,
    },
    {
      id: "foul",
      label: "Foul",
      icon: "⚠️",
      color: "bg-amber-500 hover:bg-amber-600",
      affects_score: false,
      requires_player: true,
    },
    {
      id: "offside",
      label: "Offside",
      icon: "🚫",
      color: "bg-purple-500 hover:bg-purple-600",
      affects_score: false,
      requires_player: false,
    },
    {
      id: "corner",
      label: "Corner",
      icon: "🚩",
      color: "bg-teal-500 hover:bg-teal-600",
      affects_score: false,
      requires_player: false,
    },
    {
      id: "injury",
      label: "Injury",
      icon: "🏥",
      color: "bg-red-500 hover:bg-red-600",
      affects_score: false,
      requires_player: true,
    },
    {
      id: "var_review",
      label: "VAR",
      icon: "📺",
      color: "bg-gray-600 hover:bg-gray-700",
      affects_score: false,
      requires_player: false,
    },
  ];
}

export function create_game_event(
  event_type: GameEventType,
  minute: number,
  team_side: "home" | "away" | "match",
  player_name: string = "",
  description: string = "",
): GameEvent {
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    event_type,
    minute,
    stoppage_time_minute: null,
    team_side,
    player_name,
    secondary_player_name: "",
    description: description || get_event_label(event_type),
    recorded_at: new Date().toISOString(),
  };
}

export function get_event_label(event_type: GameEventType): string {
  const labels: Record<GameEventType, string> = {
    goal: "Goal",
    own_goal: "Own Goal",
    penalty_scored: "Penalty Scored",
    penalty_missed: "Penalty Missed",
    yellow_card: "Yellow Card",
    red_card: "Red Card",
    second_yellow: "Second Yellow Card",
    substitution: "Substitution",
    foul: "Foul",
    offside: "Offside",
    corner: "Corner Kick",
    free_kick: "Free Kick",
    injury: "Injury",
    var_review: "VAR Review",
    period_start: "Period Started",
    period_end: "Period Ended",
  };
  return labels[event_type];
}

export function get_event_icon(event_type: GameEventType): string {
  const icons: Record<GameEventType, string> = {
    goal: "⚽",
    own_goal: "🥅",
    penalty_scored: "🎯",
    penalty_missed: "❌",
    yellow_card: "🟨",
    red_card: "🟥",
    second_yellow: "🟨",
    substitution: "🔄",
    foul: "⚠️",
    offside: "🚫",
    corner: "🚩",
    free_kick: "🦵",
    injury: "🏥",
    var_review: "📺",
    period_start: "▶️",
    period_end: "⏹️",
  };
  return icons[event_type];
}

export function format_event_time(
  minute: number,
  stoppage_time: number | null,
): string {
  if (stoppage_time && stoppage_time > 0) {
    return `${minute}+${stoppage_time}'`;
  }
  return `${minute}'`;
}

export function get_period_display_name(period: GamePeriod): string {
  const names: Record<GamePeriod, string> = {
    pre_game: "Pre-Game",
    first_half: "1st Half",
    half_time: "Half Time",
    second_half: "2nd Half",
    extra_time_first: "Extra Time 1st",
    extra_time_second: "Extra Time 2nd",
    penalty_shootout: "Penalties",
    finished: "Full Time",
  };
  return names[period];
}

export interface ColorClashWarning {
  party_a: string;
  party_b: string;
  color: string;
  delta_e: number;
  message: string;
}

const COLOR_SIMILARITY_THRESHOLD = 25;

export function detect_jersey_color_clashes(
  home_team_jersey: JerseyColorAssignment | undefined,
  away_team_jersey: JerseyColorAssignment | undefined,
  officials_jersey: JerseyColorAssignment | undefined,
  home_team_name: string,
  away_team_name: string,
): ColorClashWarning[] {
  const warnings: ColorClashWarning[] = [];

  function extract_hex(color: string): string {
    const trimmed = color.trim().toLowerCase();
    if (trimmed.startsWith("#")) return trimmed;
    if (/^[a-f0-9]{6}$/i.test(trimmed)) return `#${trimmed}`;
    if (/^[a-f0-9]{3}$/i.test(trimmed)) return `#${trimmed}`;
    return color;
  }

  function hex_to_lab(hex: string): { l: number; a: number; b: number } | null {
    const cleaned = hex.replace(/^#/, "").trim();
    if (cleaned.length !== 6 && cleaned.length !== 3) return null;

    let full_hex = cleaned;
    if (cleaned.length === 3) {
      full_hex =
        cleaned[0] +
        cleaned[0] +
        cleaned[1] +
        cleaned[1] +
        cleaned[2] +
        cleaned[2];
    }

    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(full_hex);
    if (!result) return null;

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b_val = parseInt(result[3], 16) / 255;

    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b_val =
      b_val > 0.04045 ? Math.pow((b_val + 0.055) / 1.055, 2.4) : b_val / 12.92;

    r *= 100;
    g *= 100;
    b_val *= 100;

    const x = r * 0.4124564 + g * 0.3575761 + b_val * 0.1804375;
    const y = r * 0.2126729 + g * 0.7151522 + b_val * 0.072175;
    const z = r * 0.0193339 + g * 0.119192 + b_val * 0.9503041;

    let lab_x = x / 95.047;
    let lab_y = y / 100.0;
    let lab_z = z / 108.883;

    lab_x =
      lab_x > 0.008856 ? Math.pow(lab_x, 1 / 3) : 7.787 * lab_x + 16 / 116;
    lab_y =
      lab_y > 0.008856 ? Math.pow(lab_y, 1 / 3) : 7.787 * lab_y + 16 / 116;
    lab_z =
      lab_z > 0.008856 ? Math.pow(lab_z, 1 / 3) : 7.787 * lab_z + 16 / 116;

    return {
      l: 116 * lab_y - 16,
      a: 500 * (lab_x - lab_y),
      b: 200 * (lab_y - lab_z),
    };
  }

  function calculate_delta_e(color_a: string, color_b: string): number | null {
    const hex_a = extract_hex(color_a);
    const hex_b = extract_hex(color_b);

    const lab_a = hex_to_lab(hex_a);
    const lab_b = hex_to_lab(hex_b);

    if (!lab_a || !lab_b) return null;

    const delta_l = lab_a.l - lab_b.l;
    const delta_a = lab_a.a - lab_b.a;
    const delta_b = lab_a.b - lab_b.b;

    return Math.sqrt(delta_l * delta_l + delta_a * delta_a + delta_b * delta_b);
  }

  function colors_are_similar(
    color_a: string | undefined,
    color_b: string | undefined,
  ): { similar: boolean; delta_e: number } {
    if (!color_a || !color_b) return { similar: false, delta_e: 100 };

    const delta_e = calculate_delta_e(color_a, color_b);
    if (delta_e === null) return { similar: false, delta_e: 100 };

    return { similar: delta_e < COLOR_SIMILARITY_THRESHOLD, delta_e };
  }

  function get_similarity_description(delta_e: number): string {
    if (delta_e < 5) return "nearly identical";
    if (delta_e < 15) return "very similar";
    return "similar";
  }

  if (home_team_jersey && away_team_jersey) {
    const result = colors_are_similar(
      home_team_jersey.main_color,
      away_team_jersey.main_color,
    );
    if (result.similar) {
      const similarity = get_similarity_description(result.delta_e);
      warnings.push({
        party_a: home_team_name,
        party_b: away_team_name,
        color: home_team_jersey.main_color,
        delta_e: result.delta_e,
        message: `${home_team_name} and ${away_team_name} have ${similarity} jersey colors (Delta E: ${result.delta_e.toFixed(1)})`,
      });
    }
  }

  if (home_team_jersey && officials_jersey) {
    const result = colors_are_similar(
      home_team_jersey.main_color,
      officials_jersey.main_color,
    );
    if (result.similar) {
      const similarity = get_similarity_description(result.delta_e);
      warnings.push({
        party_a: home_team_name,
        party_b: "Officials",
        color: home_team_jersey.main_color,
        delta_e: result.delta_e,
        message: `${home_team_name} and Officials have ${similarity} jersey colors (Delta E: ${result.delta_e.toFixed(1)})`,
      });
    }
  }

  if (away_team_jersey && officials_jersey) {
    const result = colors_are_similar(
      away_team_jersey.main_color,
      officials_jersey.main_color,
    );
    if (result.similar) {
      const similarity = get_similarity_description(result.delta_e);
      warnings.push({
        party_a: away_team_name,
        party_b: "Officials",
        color: away_team_jersey.main_color,
        delta_e: result.delta_e,
        message: `${away_team_name} and Officials have ${similarity} jersey colors (Delta E: ${result.delta_e.toFixed(1)})`,
      });
    }
  }

  return warnings;
}

export function has_color_clashes(
  home_team_jersey: JerseyColorAssignment | undefined,
  away_team_jersey: JerseyColorAssignment | undefined,
  officials_jersey: JerseyColorAssignment | undefined,
  home_team_name: string,
  away_team_name: string,
): boolean {
  const warnings = detect_jersey_color_clashes(
    home_team_jersey,
    away_team_jersey,
    officials_jersey,
    home_team_name,
    away_team_name,
  );
  return warnings.length > 0;
}
