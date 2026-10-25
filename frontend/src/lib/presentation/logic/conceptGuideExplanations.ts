import * as competition from "./conceptGuideExplanationsCompetition";
import * as match_day from "./conceptGuideExplanationsMatchDay";
import * as setup from "./conceptGuideExplanationsSetup";
import type { ConceptExplanation, ConceptId } from "./conceptGuideTypes";

const CONCEPT_EXPLANATIONS: Record<ConceptId, ConceptExplanation> = {
  organization: setup.ORGANIZATION_EXPLANATION,
  venues: setup.VENUES_EXPLANATION,
  teams: setup.TEAMS_EXPLANATION,
  players: setup.PLAYERS_EXPLANATION,
  officials: setup.OFFICIALS_EXPLANATION,
  competition: competition.COMPETITION_EXPLANATION,
  stages: competition.STAGES_EXPLANATION,
  entries: competition.ENTRIES_EXPLANATION,
  fixtures: match_day.FIXTURES_EXPLANATION,
  fixture_setup: match_day.FIXTURE_SETUP_EXPLANATION,
  lineups: match_day.LINEUPS_EXPLANATION,
  live_game: match_day.LIVE_GAME_EXPLANATION,
  results: match_day.RESULTS_EXPLANATION,
};

export function get_concept_explanation(
  concept_id: ConceptId,
): ConceptExplanation {
  return CONCEPT_EXPLANATIONS[concept_id];
}
