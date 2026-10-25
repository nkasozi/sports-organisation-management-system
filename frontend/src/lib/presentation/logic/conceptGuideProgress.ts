import {
  COMPETITION_SELECTION,
  type CompetitionProgress,
  CONCEPT_STATUS as STATUS,
  type ConceptGuideSnapshot,
  type ConceptId,
  type ConceptProgress,
} from "./conceptGuideTypes";

const MIN_TEAMS_FOR_FIXTURES = 2;
const NONE_YET = "None yet";

type ProgressRule = (snapshot: ConceptGuideSnapshot) => ConceptProgress;

export function count_label(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function locked(needed: string): ConceptProgress {
  return { status: STATUS.LOCKED, detail: `Needs ${needed}` };
}

function counted(count: number, noun: string): ConceptProgress {
  return count > 0
    ? { status: STATUS.DONE, detail: count_label(count, noun) }
    : { status: STATUS.TODO, detail: NONE_YET };
}

function requires_organization(count: number, noun: string): ProgressRule {
  return (snapshot) =>
    snapshot.organization_count > 0
      ? counted(count, noun)
      : locked("Organization");
}

export function selected_competition(
  snapshot: ConceptGuideSnapshot,
): CompetitionProgress | false {
  return snapshot.competition_state.status === COMPETITION_SELECTION.SELECTED
    ? snapshot.competition_state.progress
    : false;
}

function with_fixtures(
  rule: (competition: CompetitionProgress) => ConceptProgress,
): ProgressRule {
  return (snapshot) => {
    const competition = selected_competition(snapshot);
    if (!competition || competition.fixture_count === 0)
      return locked("Fixtures");
    return rule(competition);
  };
}

function game_readiness(
  ready_count: number,
  open_count: number,
): ConceptProgress {
  if (open_count === 0)
    return { status: STATUS.DONE, detail: "No upcoming games" };
  return {
    status: ready_count >= open_count ? STATUS.DONE : STATUS.TODO,
    detail: `${ready_count} of ${open_count} games ready`,
  };
}

function entries_progress(snapshot: ConceptGuideSnapshot): ConceptProgress {
  const competition = selected_competition(snapshot);
  if (!competition) return locked("Competition");
  if (snapshot.team_count === 0) return locked("Teams");
  return {
    status:
      competition.entered_team_count >= MIN_TEAMS_FOR_FIXTURES
        ? STATUS.DONE
        : STATUS.TODO,
    detail: count_label(competition.entered_team_count, "team"),
  };
}

function fixtures_progress(snapshot: ConceptGuideSnapshot): ConceptProgress {
  const competition = selected_competition(snapshot);
  if (!competition) return locked("Competition");
  if (competition.entered_team_count < MIN_TEAMS_FOR_FIXTURES)
    return locked(`${MIN_TEAMS_FOR_FIXTURES} teams entered`);
  return counted(competition.fixture_count, "fixture");
}

function live_game_progress(competition: CompetitionProgress): ConceptProgress {
  if (competition.live_count > 0)
    return {
      status: STATUS.DONE,
      detail: `${competition.live_count} live now`,
    };
  return competition.completed_count > 0
    ? { status: STATUS.DONE, detail: "No game live now" }
    : { status: STATUS.TODO, detail: "No games played yet" };
}

const PROGRESS_RULES: Record<ConceptId, ProgressRule> = {
  organization: (snapshot) =>
    counted(snapshot.organization_count, "organization"),
  venues: (snapshot) =>
    requires_organization(snapshot.venue_count, "venue")(snapshot),
  teams: (snapshot) =>
    requires_organization(snapshot.team_count, "team")(snapshot),
  officials: (snapshot) =>
    requires_organization(snapshot.official_count, "official")(snapshot),
  players: (snapshot) =>
    snapshot.team_count > 0
      ? counted(snapshot.player_count, "player")
      : locked("Teams"),
  competition: (snapshot) =>
    requires_organization(snapshot.competition_count, "competition")(snapshot),
  stages: (snapshot) => {
    const competition = selected_competition(snapshot);
    return competition
      ? counted(competition.stage_count, "stage")
      : locked("Competition");
  },
  entries: entries_progress,
  fixtures: fixtures_progress,
  fixture_setup: with_fixtures((competition) =>
    game_readiness(
      competition.open_fixtures_with_setup,
      competition.open_fixture_count,
    ),
  ),
  lineups: with_fixtures((competition) =>
    game_readiness(
      competition.open_fixtures_with_lineups,
      competition.open_fixture_count,
    ),
  ),
  live_game: with_fixtures(live_game_progress),
  results: (snapshot) => {
    const competition = selected_competition(snapshot);
    return competition && competition.completed_count > 0
      ? { status: STATUS.DONE, detail: `${competition.completed_count} played` }
      : locked("a finished game");
  },
};

export function build_concept_progress(
  snapshot: ConceptGuideSnapshot,
): Record<ConceptId, ConceptProgress> {
  return Object.fromEntries(
    Object.entries(PROGRESS_RULES).map(([concept_id, rule]) => [
      concept_id,
      rule(snapshot),
    ]),
  ) as Record<ConceptId, ConceptProgress>;
}
