import {
  CONCEPT_ID as ID,
  CONCEPT_LANE as LANE,
  type ConceptDefinition,
} from "./conceptGuideTypes";

export const MATCH_DAY_CONCEPTS: ConceptDefinition[] = [
  {
    id: ID.FIXTURES,
    name: "Fixtures",
    lane: LANE.MATCH_DAY,
    summary: "Scheduled games between two teams.",
    route: "/fixtures",
    needs: [
      {
        concept_id: ID.ENTRIES,
        reason: "Both teams must be entered in the competition.",
      },
      { concept_id: ID.VENUES, reason: "The game is played at a venue." },
      {
        concept_id: ID.STAGES,
        reason:
          "Each fixture belongs to a stage, so it counts in the right table.",
      },
    ],
    unlocks: [
      {
        concept_id: ID.FIXTURE_SETUP,
        reason: "Each fixture gets officials and jerseys.",
      },
      {
        concept_id: ID.LINEUPS,
        reason: "Each team names a lineup for the fixture.",
      },
    ],
  },
  {
    id: ID.FIXTURE_SETUP,
    name: "Fixture setup",
    lane: LANE.MATCH_DAY,
    summary: "Officials and jersey colours for a game.",
    route: "/fixture-details-setup",
    needs: [
      { concept_id: ID.FIXTURES, reason: "Setup is done for one fixture." },
      {
        concept_id: ID.OFFICIALS,
        reason: "Officials are chosen from your list.",
      },
    ],
    unlocks: [
      {
        concept_id: ID.LIVE_GAME,
        reason: "The game starts with its officials in place.",
      },
    ],
  },
  {
    id: ID.LINEUPS,
    name: "Lineups",
    lane: LANE.MATCH_DAY,
    summary: "The players each team picks for a game.",
    route: "/fixture-lineups",
    needs: [
      { concept_id: ID.FIXTURES, reason: "A lineup is for one fixture." },
      {
        concept_id: ID.PLAYERS,
        reason: "Lineups are picked from a team's players.",
      },
    ],
    unlocks: [
      {
        concept_id: ID.LIVE_GAME,
        reason: "Goals, cards and subs name lineup players.",
      },
    ],
  },
  {
    id: ID.LIVE_GAME,
    name: "Live game",
    lane: LANE.MATCH_DAY,
    summary: "Run the clock and record what happens.",
    route: "/live-games",
    needs: [
      {
        concept_id: ID.FIXTURE_SETUP,
        reason: "Officials and jerseys are set first.",
      },
      {
        concept_id: ID.LINEUPS,
        reason: "Events are recorded against lineup players.",
      },
    ],
    unlocks: [
      { concept_id: ID.RESULTS, reason: "A finished game becomes a result." },
    ],
  },
  {
    id: ID.RESULTS,
    name: "Results and standings",
    lane: LANE.MATCH_DAY,
    summary: "Scores, tables, stats and match reports.",
    route: "/competition-results",
    needs: [
      { concept_id: ID.LIVE_GAME, reason: "Results come from finished games." },
    ],
    unlocks: [],
  },
];
