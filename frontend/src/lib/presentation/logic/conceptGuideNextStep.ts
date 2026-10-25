import {
  build_concept_progress,
  count_label,
  selected_competition,
} from "./conceptGuideProgress";
import {
  type CompetitionProgress,
  CONCEPT_ID as ID,
  CONCEPT_STATUS,
  type ConceptGuideSnapshot,
  type ConceptId,
  type ConceptNextStep,
} from "./conceptGuideTypes";

const NEXT_STEP_ORDER: ConceptId[] = [
  ID.ORGANIZATION,
  ID.TEAMS,
  ID.VENUES,
  ID.OFFICIALS,
  ID.PLAYERS,
  ID.COMPETITION,
  ID.ENTRIES,
  ID.STAGES,
  ID.FIXTURES,
  ID.FIXTURE_SETUP,
  ID.LINEUPS,
  ID.LIVE_GAME,
];

const ALL_SET_STEP: ConceptNextStep = {
  concept_id: ID.LIVE_GAME,
  message: "Everything is set up. Follow your games as they happen.",
  action_label: "Watch live games",
};

function games_waiting(
  snapshot: ConceptGuideSnapshot,
  name: string,
  count_ready: (competition: CompetitionProgress) => number,
): string {
  const competition = selected_competition(snapshot);
  const waiting = competition
    ? competition.open_fixture_count - count_ready(competition)
    : 0;
  const verb = waiting === 1 ? "still needs" : "still need";
  return `${count_label(waiting, "upcoming game")} in ${name} ${verb}`;
}

type StepWriter = (
  snapshot: ConceptGuideSnapshot,
  name: string,
) => ConceptNextStep;

function step(
  concept_id: ConceptId,
  message: string,
  action_label: string,
): ConceptNextStep {
  return { concept_id, message, action_label };
}

const STEP_WRITERS: Record<ConceptId, StepWriter> = {
  organization: () =>
    step(
      ID.ORGANIZATION,
      "Start by creating your organization: the club, league or association you run.",
      "Create organization",
    ),
  teams: () => step(ID.TEAMS, "Add the teams that will play.", "Add teams"),
  venues: () =>
    step(
      ID.VENUES,
      "Add the grounds where your games are played.",
      "Add venues",
    ),
  officials: () =>
    step(
      ID.OFFICIALS,
      "Register the referees and officials who run your games.",
      "Add officials",
    ),
  players: () =>
    step(
      ID.PLAYERS,
      "Add players and link them to their teams.",
      "Add players",
    ),
  competition: () =>
    step(
      ID.COMPETITION,
      "Create a competition, such as this season's league or cup.",
      "Create competition",
    ),
  entries: (_snapshot, name) =>
    step(
      ID.ENTRIES,
      `Enter at least 2 teams into ${name} to schedule fixtures.`,
      "Enter teams",
    ),
  stages: (_snapshot, name) =>
    step(
      ID.STAGES,
      `Add stages to ${name}, such as a group stage then knockouts.`,
      "Add stages",
    ),
  fixtures: (_snapshot, name) =>
    step(ID.FIXTURES, `Schedule the games for ${name}.`, "Create fixtures"),
  fixture_setup: (snapshot, name) =>
    step(
      ID.FIXTURE_SETUP,
      `${games_waiting(snapshot, name, (competition) => competition.open_fixtures_with_setup)} officials and jerseys.`,
      "Set up fixtures",
    ),
  lineups: (snapshot, name) =>
    step(
      ID.LINEUPS,
      `${games_waiting(snapshot, name, (competition) => competition.open_fixtures_with_lineups)} lineups from both teams.`,
      "Pick lineups",
    ),
  live_game: () =>
    step(
      ID.LIVE_GAME,
      "When a game kicks off, run it live to record goals, cards and substitutions.",
      "Go to live games",
    ),
  results: () => ALL_SET_STEP,
};

export function find_next_concept_step(
  snapshot: ConceptGuideSnapshot,
): ConceptNextStep {
  const progress = build_concept_progress(snapshot);
  const next_concept = NEXT_STEP_ORDER.find(
    (concept_id) => progress[concept_id].status === CONCEPT_STATUS.TODO,
  );
  if (!next_concept) return ALL_SET_STEP;
  const competition = selected_competition(snapshot);
  return STEP_WRITERS[next_concept](
    snapshot,
    competition ? competition.name : "",
  );
}
