import type { CreateSportInput } from "./SportTypes";

export const FIELD_HOCKEY_PERIODS: CreateSportInput["periods"] = [
  {
    id: "first_quarter",
    name: "1st Quarter",
    duration_minutes: 15,
    is_break: false,
    order: 1,
  },
  {
    id: "break_1",
    name: "Break",
    duration_minutes: 2,
    is_break: true,
    order: 2,
  },
  {
    id: "second_quarter",
    name: "2nd Quarter",
    duration_minutes: 15,
    is_break: false,
    order: 3,
  },
  {
    id: "half_time",
    name: "Half Time",
    duration_minutes: 10,
    is_break: true,
    order: 4,
  },
  {
    id: "third_quarter",
    name: "3rd Quarter",
    duration_minutes: 15,
    is_break: false,
    order: 5,
  },
  {
    id: "break_2",
    name: "Break",
    duration_minutes: 2,
    is_break: true,
    order: 6,
  },
  {
    id: "fourth_quarter",
    name: "4th Quarter",
    duration_minutes: 15,
    is_break: false,
    order: 7,
  },
];

export const FIELD_HOCKEY_CARD_TYPES: CreateSportInput["card_types"] = [
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
];

export const FIELD_HOCKEY_FOUL_CATEGORIES: CreateSportInput["foul_categories"] =
  [
    {
      id: "obstruction",
      name: "Obstruction",
      severity: "minor",
      description: "Blocking opponent's path or stick",
      typical_penalty: "Free hit to opposing team",
      results_in_card: "",
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
  ];

export const FIELD_HOCKEY_OFFICIAL_REQUIREMENTS: CreateSportInput["official_requirements"] =
  [
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
  ];

export const FIELD_HOCKEY_OVERTIME_RULES: CreateSportInput["overtime_rules"] = {
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
};

export const FIELD_HOCKEY_SCORING_RULES: CreateSportInput["scoring_rules"] = [
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
];

export const FIELD_HOCKEY_SUBSTITUTION_RULES: CreateSportInput["substitution_rules"] =
  {
    max_substitutions_per_game: -1,
    max_substitution_windows: -1,
    rolling_substitutions_allowed: true,
    return_after_substitution_allowed: true,
  };
