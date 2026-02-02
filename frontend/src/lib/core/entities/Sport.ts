import type { BaseEntity } from "./BaseEntity";

export type CardType = {
  id: string;
  name: string;
  color: string;
  severity: "warning" | "ejection" | "suspension";
  description: string;
  consequences: string[];
};

export type FoulCategory = {
  id: string;
  name: string;
  severity: "minor" | "moderate" | "major" | "severe";
  description: string;
  typical_penalty: string;
  results_in_card: string | null;
};

export type SportGamePeriod = {
  id: string;
  name: string;
  duration_minutes: number;
  is_break: boolean;
  order: number;
};

export type OfficialRequirement = {
  role_id: string;
  role_name: string;
  minimum_count: number;
  maximum_count: number;
  is_mandatory: boolean;
  description: string;
};

export type OvertimeRule = {
  is_enabled: boolean;
  trigger_condition: "draw" | "knockout_draw" | "never";
  overtime_type:
    | "extra_time"
    | "golden_goal"
    | "silver_goal"
    | "penalties"
    | "replay"
    | "shootout";
  extra_time_periods: SportGamePeriod[];
  penalties_config: {
    initial_rounds: number;
    sudden_death_after: boolean;
  } | null;
};

export type ScoringRule = {
  event_type: string;
  points_awarded: number;
  description: string;
};

export type SubstitutionRule = {
  max_substitutions_per_game: number;
  max_substitution_windows: number | null;
  rolling_substitutions_allowed: boolean;
  return_after_substitution_allowed: boolean;
};

export type SportStatus = "active" | "inactive" | "archived";

export interface Sport extends BaseEntity {
  name: string;
  code: string;
  description: string;
  icon_url: string;

  standard_game_duration_minutes: number;
  periods: SportGamePeriod[];

  card_types: CardType[];
  foul_categories: FoulCategory[];

  official_requirements: OfficialRequirement[];

  overtime_rules: OvertimeRule;

  scoring_rules: ScoringRule[];

  substitution_rules: SubstitutionRule;

  max_players_on_field: number;
  min_players_on_field: number;
  max_squad_size: number;
  min_players_per_fixture: number;
  max_players_per_fixture: number;

  additional_rules: Record<string, string | number | boolean>;

  status: SportStatus;
}

export type CreateSportInput = Omit<Sport, "id" | "created_at" | "updated_at">;
export type UpdateSportInput = Partial<CreateSportInput>;

export function create_default_card_types(): CardType[] {
  return [
    {
      id: "yellow_card",
      name: "Yellow Card",
      color: "#FBBF24",
      severity: "warning",
      description: "Official warning for misconduct",
      consequences: ["Two yellow cards result in a red card"],
    },
    {
      id: "red_card",
      name: "Red Card",
      color: "#DC2626",
      severity: "ejection",
      description: "Immediate ejection from the game",
      consequences: [
        "Player must leave the field",
        "Team plays with one less player",
        "Possible suspension for future games",
      ],
    },
  ];
}

export function create_default_foul_categories(): FoulCategory[] {
  return [
    {
      id: "minor_foul",
      name: "Minor Foul",
      severity: "minor",
      description: "Technical infringement or minor contact",
      typical_penalty: "Free kick to opposing team",
      results_in_card: null,
    },
    {
      id: "tactical_foul",
      name: "Tactical Foul",
      severity: "moderate",
      description: "Deliberate foul to stop play or counter-attack",
      typical_penalty: "Free kick and possible card",
      results_in_card: "yellow_card",
    },
    {
      id: "serious_foul_play",
      name: "Serious Foul Play",
      severity: "major",
      description: "Excessive force or brutality endangering opponent",
      typical_penalty: "Free kick or penalty, red card",
      results_in_card: "red_card",
    },
    {
      id: "violent_conduct",
      name: "Violent Conduct",
      severity: "severe",
      description: "Violent behavior towards any person on or off the field",
      typical_penalty: "Red card and possible extended ban",
      results_in_card: "red_card",
    },
  ];
}

export function create_default_football_periods(): SportGamePeriod[] {
  return [
    {
      id: "first_half",
      name: "First Half",
      duration_minutes: 45,
      is_break: false,
      order: 1,
    },
    {
      id: "half_time",
      name: "Half Time",
      duration_minutes: 15,
      is_break: true,
      order: 2,
    },
    {
      id: "second_half",
      name: "Second Half",
      duration_minutes: 45,
      is_break: false,
      order: 3,
    },
  ];
}

export function create_default_official_requirements(): OfficialRequirement[] {
  return [
    {
      role_id: "referee",
      role_name: "Main Referee",
      minimum_count: 1,
      maximum_count: 1,
      is_mandatory: true,
      description: "The main official who enforces the rules",
    },
    {
      role_id: "assistant_referee",
      role_name: "Assistant Referee",
      minimum_count: 2,
      maximum_count: 2,
      is_mandatory: true,
      description: "Linesmen who assist with offside and out-of-bounds calls",
    },
    {
      role_id: "fourth_official",
      role_name: "Fourth Official",
      minimum_count: 0,
      maximum_count: 1,
      is_mandatory: false,
      description: "Manages substitutions and technical area",
    },
    {
      role_id: "var_official",
      role_name: "VAR Official",
      minimum_count: 0,
      maximum_count: 2,
      is_mandatory: false,
      description: "Video Assistant Referee for reviewing decisions",
    },
  ];
}

export function create_default_overtime_rules(): OvertimeRule {
  return {
    is_enabled: true,
    trigger_condition: "knockout_draw",
    overtime_type: "extra_time",
    extra_time_periods: [
      {
        id: "extra_time_1",
        name: "Extra Time 1st Half",
        duration_minutes: 15,
        is_break: false,
        order: 1,
      },
      {
        id: "extra_time_break",
        name: "Extra Time Break",
        duration_minutes: 1,
        is_break: true,
        order: 2,
      },
      {
        id: "extra_time_2",
        name: "Extra Time 2nd Half",
        duration_minutes: 15,
        is_break: false,
        order: 3,
      },
    ],
    penalties_config: {
      initial_rounds: 5,
      sudden_death_after: true,
    },
  };
}

export function create_default_scoring_rules(): ScoringRule[] {
  return [
    {
      event_type: "goal",
      points_awarded: 1,
      description: "Ball crosses the goal line between the posts",
    },
    {
      event_type: "own_goal",
      points_awarded: 1,
      description: "Goal scored against own team (counts for opponent)",
    },
    {
      event_type: "penalty_kick_goal",
      points_awarded: 1,
      description: "Goal scored from penalty spot",
    },
  ];
}

export function create_default_substitution_rules(): SubstitutionRule {
  return {
    max_substitutions_per_game: 5,
    max_substitution_windows: 3,
    rolling_substitutions_allowed: false,
    return_after_substitution_allowed: false,
  };
}

export function create_empty_sport_input(): CreateSportInput {
  return {
    name: "",
    code: "",
    description: "",
    icon_url: "",
    standard_game_duration_minutes: 90,
    periods: create_default_football_periods(),
    card_types: create_default_card_types(),
    foul_categories: create_default_foul_categories(),
    official_requirements: create_default_official_requirements(),
    overtime_rules: create_default_overtime_rules(),
    scoring_rules: create_default_scoring_rules(),
    substitution_rules: create_default_substitution_rules(),
    max_players_on_field: 11,
    min_players_on_field: 7,
    max_squad_size: 23,
    min_players_per_fixture: 11,
    max_players_per_fixture: 18,
    additional_rules: {},
    status: "active",
  };
}

export function create_football_sport_preset(): CreateSportInput {
  return {
    name: "Football (Soccer)",
    code: "FOOTBALL",
    description: "Association football, commonly known as soccer",
    icon_url: "⚽",
    standard_game_duration_minutes: 90,
    periods: create_default_football_periods(),
    card_types: create_default_card_types(),
    foul_categories: create_default_foul_categories(),
    official_requirements: create_default_official_requirements(),
    overtime_rules: create_default_overtime_rules(),
    scoring_rules: create_default_scoring_rules(),
    substitution_rules: create_default_substitution_rules(),
    max_players_on_field: 11,
    min_players_on_field: 7,
    max_squad_size: 23,
    min_players_per_fixture: 11,
    max_players_per_fixture: 18,
    additional_rules: {
      offside_rule_enabled: true,
      goal_line_technology_enabled: false,
      var_enabled: false,
    },
    status: "active",
  };
}

export function create_field_hockey_sport_preset(): CreateSportInput {
  return {
    name: "Field Hockey",
    code: "FIELD_HOCKEY",
    description: "Field Hockey with international FIH rules",
    icon_url: "🏑",
    standard_game_duration_minutes: 70,
    periods: [
      {
        id: "first_half",
        name: "First Half",
        duration_minutes: 35,
        is_break: false,
        order: 1,
      },
      {
        id: "half_time",
        name: "Half Time",
        duration_minutes: 10,
        is_break: true,
        order: 2,
      },
      {
        id: "second_half",
        name: "Second Half",
        duration_minutes: 35,
        is_break: false,
        order: 3,
      },
    ],
    card_types: [
      {
        id: "green_card",
        name: "Green Card",
        color: "#22C55E",
        severity: "warning",
        description: "Caution for unsporting conduct or rule violation",
        consequences: ["Player receives a temporary suspension of 2-5 minutes"],
      },
      {
        id: "yellow_card",
        name: "Yellow Card",
        color: "#FBBF24",
        severity: "warning",
        description: "Second caution or serious unsporting conduct",
        consequences: ["Player suspended for the remainder of the game"],
      },
      {
        id: "red_card",
        name: "Red Card",
        color: "#DC2626",
        severity: "ejection",
        description: "Violent conduct or gross misconduct",
        consequences: [
          "Player must leave the field immediately",
          "Team plays with one less player",
          "Possible extended ban",
        ],
      },
    ],
    foul_categories: [
      {
        id: "obstruction",
        name: "Obstruction",
        severity: "minor",
        description: "Blocking opponent's path or stick",
        typical_penalty: "Free hit to opposing team",
        results_in_card: null,
      },
      {
        id: "stick_check_foul",
        name: "Dangerous Play - Stick",
        severity: "moderate",
        description: "Using stick in a dangerous manner",
        typical_penalty: "Free hit and possible green card",
        results_in_card: "green_card",
      },
      {
        id: "body_contact",
        name: "Excessive Body Contact",
        severity: "major",
        description: "Excessive contact or charging",
        typical_penalty: "Penalty corner or free hit, yellow/green card",
        results_in_card: "yellow_card",
      },
      {
        id: "violent_conduct",
        name: "Violent Conduct",
        severity: "severe",
        description: "Violent behavior towards any person",
        typical_penalty: "Red card and possible extended ban",
        results_in_card: "red_card",
      },
    ],
    official_requirements: [
      {
        role_id: "referee",
        role_name: "Main Umpire",
        minimum_count: 1,
        maximum_count: 1,
        is_mandatory: true,
        description: "Primary official who enforces the rules",
      },
      {
        role_id: "umpire",
        role_name: "Second Umpire",
        minimum_count: 1,
        maximum_count: 1,
        is_mandatory: true,
        description: "Secondary official who assists and covers the other half",
      },
    ],
    overtime_rules: {
      is_enabled: true,
      trigger_condition: "knockout_draw",
      overtime_type: "extra_time",
      extra_time_periods: [
        {
          id: "ot_first",
          name: "Overtime 1st Half",
          duration_minutes: 7,
          is_break: false,
          order: 1,
        },
        {
          id: "ot_break",
          name: "Overtime Break",
          duration_minutes: 5,
          is_break: true,
          order: 2,
        },
        {
          id: "ot_second",
          name: "Overtime 2nd Half",
          duration_minutes: 7,
          is_break: false,
          order: 3,
        },
      ],
      penalties_config: {
        initial_rounds: 5,
        sudden_death_after: true,
      },
    },
    scoring_rules: [
      {
        event_type: "goal",
        points_awarded: 1,
        description: "Ball driven between goal posts below the backline",
      },
      {
        event_type: "penalty_goal",
        points_awarded: 1,
        description: "Goal scored from penalty stroke",
      },
    ],
    substitution_rules: {
      max_substitutions_per_game: -1,
      max_substitution_windows: null,
      rolling_substitutions_allowed: true,
      return_after_substitution_allowed: true,
    },
    max_players_on_field: 11,
    min_players_on_field: 11,
    max_squad_size: 16,
    min_players_per_fixture: 11,
    max_players_per_fixture: 16,
    additional_rules: {
      minimum_hitting_distance: 5,
      penalty_corner_enabled: true,
      self_pass_allowed: true,
    },
    status: "active",
  };
}

export function create_basketball_sport_preset(): CreateSportInput {
  return {
    name: "Basketball",
    code: "BASKETBALL",
    description: "Basketball with standard FIBA rules",
    icon_url: "🏀",
    standard_game_duration_minutes: 40,
    periods: [
      {
        id: "q1",
        name: "1st Quarter",
        duration_minutes: 10,
        is_break: false,
        order: 1,
      },
      {
        id: "break1",
        name: "Break",
        duration_minutes: 2,
        is_break: true,
        order: 2,
      },
      {
        id: "q2",
        name: "2nd Quarter",
        duration_minutes: 10,
        is_break: false,
        order: 3,
      },
      {
        id: "halftime",
        name: "Half Time",
        duration_minutes: 15,
        is_break: true,
        order: 4,
      },
      {
        id: "q3",
        name: "3rd Quarter",
        duration_minutes: 10,
        is_break: false,
        order: 5,
      },
      {
        id: "break2",
        name: "Break",
        duration_minutes: 2,
        is_break: true,
        order: 6,
      },
      {
        id: "q4",
        name: "4th Quarter",
        duration_minutes: 10,
        is_break: false,
        order: 7,
      },
    ],
    card_types: [
      {
        id: "technical_foul",
        name: "Technical Foul",
        color: "#F59E0B",
        severity: "warning",
        description: "Non-contact foul for unsportsmanlike conduct",
        consequences: [
          "Free throws for opponent",
          "Two technical fouls result in ejection",
        ],
      },
      {
        id: "flagrant_foul",
        name: "Flagrant Foul",
        color: "#DC2626",
        severity: "ejection",
        description: "Unnecessary or excessive contact",
        consequences: [
          "Free throws and possession for opponent",
          "Possible ejection",
        ],
      },
    ],
    foul_categories: [
      {
        id: "personal_foul",
        name: "Personal Foul",
        severity: "minor",
        description: "Illegal physical contact",
        typical_penalty: "Free throws if in bonus or shooting",
        results_in_card: null,
      },
      {
        id: "offensive_foul",
        name: "Offensive Foul",
        severity: "minor",
        description: "Illegal contact by offensive player",
        typical_penalty: "Loss of possession",
        results_in_card: null,
      },
    ],
    official_requirements: [
      {
        role_id: "referee",
        role_name: "Lead Referee",
        minimum_count: 1,
        maximum_count: 1,
        is_mandatory: true,
        description: "The lead official",
      },
      {
        role_id: "umpire",
        role_name: "Umpire",
        minimum_count: 1,
        maximum_count: 2,
        is_mandatory: true,
        description: "Secondary officials",
      },
      {
        role_id: "scorer",
        role_name: "Scorer",
        minimum_count: 1,
        maximum_count: 1,
        is_mandatory: true,
        description: "Records points and fouls",
      },
      {
        role_id: "timekeeper",
        role_name: "Timekeeper",
        minimum_count: 1,
        maximum_count: 1,
        is_mandatory: true,
        description: "Manages game clock",
      },
    ],
    overtime_rules: {
      is_enabled: true,
      trigger_condition: "draw",
      overtime_type: "extra_time",
      extra_time_periods: [
        {
          id: "overtime",
          name: "Overtime",
          duration_minutes: 5,
          is_break: false,
          order: 1,
        },
      ],
      penalties_config: null,
    },
    scoring_rules: [
      {
        event_type: "field_goal_2pt",
        points_awarded: 2,
        description: "Field goal inside the arc",
      },
      {
        event_type: "field_goal_3pt",
        points_awarded: 3,
        description: "Field goal beyond the arc",
      },
      {
        event_type: "free_throw",
        points_awarded: 1,
        description: "Successful free throw",
      },
    ],
    substitution_rules: {
      max_substitutions_per_game: -1,
      max_substitution_windows: null,
      rolling_substitutions_allowed: true,
      return_after_substitution_allowed: true,
    },
    max_players_on_field: 5,
    min_players_on_field: 5,
    max_squad_size: 12,
    min_players_per_fixture: 5,
    max_players_per_fixture: 12,
    additional_rules: {
      shot_clock_seconds: 24,
      foul_limit_per_player: 5,
      team_foul_bonus_threshold: 5,
    },
    status: "active",
  };
}

export function validate_sport_input(input: CreateSportInput): string[] {
  const validation_errors: string[] = [];

  if (!input.name || input.name.trim().length < 2) {
    validation_errors.push("Sport name must be at least 2 characters");
  }

  if (!input.code || input.code.trim().length < 2) {
    validation_errors.push("Sport code must be at least 2 characters");
  }

  if (input.standard_game_duration_minutes < 1) {
    validation_errors.push("Game duration must be at least 1 minute");
  }

  if (!input.periods || input.periods.length === 0) {
    validation_errors.push("At least one game period is required");
  }

  const mandatory_officials = input.official_requirements.filter(
    (r) => r.is_mandatory,
  );
  if (mandatory_officials.length === 0) {
    validation_errors.push("At least one mandatory official role is required");
  }

  if (input.max_players_on_field < input.min_players_on_field) {
    validation_errors.push(
      "Maximum players on field must be >= minimum players",
    );
  }

  if (input.max_squad_size < input.max_players_on_field) {
    validation_errors.push(
      "Maximum squad size must be >= maximum players on field",
    );
  }

  return validation_errors;
}

export function calculate_total_game_duration(
  periods: SportGamePeriod[],
): number {
  return periods
    .filter((p) => !p.is_break)
    .reduce((total, period) => total + period.duration_minutes, 0);
}

export function get_mandatory_official_count(
  requirements: OfficialRequirement[],
): number {
  return requirements
    .filter((r) => r.is_mandatory)
    .reduce((total, r) => total + r.minimum_count, 0);
}
