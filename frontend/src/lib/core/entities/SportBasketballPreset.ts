import { create_default_penalties_config } from "./SportDefaults";
import type { CreateSportInput } from "./SportTypes";

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
        results_in_card: "",
      },
      {
        id: "offensive_foul",
        name: "Offensive Foul",
        severity: "minor",
        description: "Illegal contact by offensive player",
        typical_penalty: "Loss of possession",
        results_in_card: "",
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
      penalties_config: create_default_penalties_config(),
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
      max_substitution_windows: -1,
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
