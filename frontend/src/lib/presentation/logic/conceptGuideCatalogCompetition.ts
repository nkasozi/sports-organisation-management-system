import {
  CONCEPT_ID as ID,
  CONCEPT_LANE as LANE,
  type ConceptDefinition,
} from "./conceptGuideTypes";

export const COMPETITION_CONCEPTS: ConceptDefinition[] = [
  {
    id: ID.COMPETITION,
    name: "Competition",
    lane: LANE.COMPETITION,
    summary: "A league or cup for one season.",
    route: "/competitions",
    needs: [
      {
        concept_id: ID.ORGANIZATION,
        reason: "An organization runs the competition.",
      },
    ],
    unlocks: [
      { concept_id: ID.STAGES, reason: "A competition is split into stages." },
      {
        concept_id: ID.ENTRIES,
        reason: "Teams are entered into a competition.",
      },
    ],
  },
  {
    id: ID.STAGES,
    name: "Stages",
    lane: LANE.COMPETITION,
    summary: "Phases such as groups, then knockouts.",
    route: "/competitions",
    needs: [
      {
        concept_id: ID.COMPETITION,
        reason: "Stages are part of a competition.",
      },
    ],
    unlocks: [
      {
        concept_id: ID.FIXTURES,
        reason: "Fixtures are grouped by stage for standings.",
      },
    ],
  },
  {
    id: ID.ENTRIES,
    name: "Teams entered",
    lane: LANE.COMPETITION,
    summary: "Which teams play in this competition.",
    route: "/competitions",
    needs: [
      {
        concept_id: ID.COMPETITION,
        reason: "Teams are entered into a competition.",
      },
      { concept_id: ID.TEAMS, reason: "Only existing teams can be entered." },
    ],
    unlocks: [
      { concept_id: ID.FIXTURES, reason: "A fixture needs two entered teams." },
    ],
  },
];
