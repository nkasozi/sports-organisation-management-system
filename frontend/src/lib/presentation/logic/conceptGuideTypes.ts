export const CONCEPT_ID = {
  ORGANIZATION: "organization",
  VENUES: "venues",
  TEAMS: "teams",
  PLAYERS: "players",
  OFFICIALS: "officials",
  COMPETITION: "competition",
  STAGES: "stages",
  ENTRIES: "entries",
  FIXTURES: "fixtures",
  FIXTURE_SETUP: "fixture_setup",
  LINEUPS: "lineups",
  LIVE_GAME: "live_game",
  RESULTS: "results",
} as const;

export type ConceptId = (typeof CONCEPT_ID)[keyof typeof CONCEPT_ID];

export const CONCEPT_LANE = {
  SETUP: "setup",
  COMPETITION: "competition",
  MATCH_DAY: "match_day",
} as const;

export type ConceptLane = (typeof CONCEPT_LANE)[keyof typeof CONCEPT_LANE];

export const CONCEPT_STATUS = {
  DONE: "done",
  TODO: "todo",
  LOCKED: "locked",
} as const;

export type ConceptStatus =
  (typeof CONCEPT_STATUS)[keyof typeof CONCEPT_STATUS];

export interface ConceptConnection {
  concept_id: ConceptId;
  reason: string;
}

export interface ConceptScenario {
  title: string;
  story: string;
}

export interface ConceptDefinition {
  id: ConceptId;
  name: string;
  lane: ConceptLane;
  summary: string;
  route: string;
  needs: ConceptConnection[];
  unlocks: ConceptConnection[];
}

export interface ConceptExplanation {
  what_it_is: string;
  why_it_matters: string;
  scenarios: ConceptScenario[];
}

export const COMPETITION_SELECTION = {
  NONE: "none",
  SELECTED: "selected",
} as const;

export interface CompetitionProgress {
  name: string;
  stage_count: number;
  entered_team_count: number;
  fixture_count: number;
  open_fixture_count: number;
  open_fixtures_with_setup: number;
  open_fixtures_with_lineups: number;
  live_count: number;
  completed_count: number;
}

export type CompetitionProgressState =
  | { status: typeof COMPETITION_SELECTION.NONE }
  | {
      status: typeof COMPETITION_SELECTION.SELECTED;
      progress: CompetitionProgress;
    };

export interface ConceptGuideSnapshot {
  organization_count: number;
  venue_count: number;
  team_count: number;
  player_count: number;
  official_count: number;
  competition_count: number;
  competition_state: CompetitionProgressState;
}

export interface ConceptProgress {
  status: ConceptStatus;
  detail: string;
}

export interface ConceptNextStep {
  concept_id: ConceptId;
  message: string;
  action_label: string;
}
