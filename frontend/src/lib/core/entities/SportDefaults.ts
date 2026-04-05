import type {
  CardType,
  FoulCategory,
  SportGamePeriod,
  OfficialRequirement,
  OvertimeRule,
  ScoringRule,
  SubstitutionRule,
} from "./SportTypes";

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
