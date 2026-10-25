import {
  CONCEPT_ID as ID,
  CONCEPT_LANE as LANE,
  type ConceptDefinition,
} from "./conceptGuideTypes";

export const SETUP_CONCEPTS: ConceptDefinition[] = [
  {
    id: ID.ORGANIZATION,
    name: "Organization",
    lane: LANE.SETUP,
    summary: "Your club, league or association.",
    route: "/organizations",
    needs: [],
    unlocks: [
      { concept_id: ID.TEAMS, reason: "Teams belong to an organization." },
      {
        concept_id: ID.VENUES,
        reason: "Venues are the organization's grounds.",
      },
      { concept_id: ID.OFFICIALS, reason: "Officials are registered with it." },
      { concept_id: ID.COMPETITION, reason: "It runs the competitions." },
    ],
  },
  {
    id: ID.VENUES,
    name: "Venues",
    lane: LANE.SETUP,
    summary: "Grounds where games are played.",
    route: "/venues",
    needs: [
      {
        concept_id: ID.ORGANIZATION,
        reason: "A venue is listed under an organization.",
      },
    ],
    unlocks: [
      {
        concept_id: ID.FIXTURES,
        reason: "Every fixture is played at a venue.",
      },
    ],
  },
  {
    id: ID.TEAMS,
    name: "Teams",
    lane: LANE.SETUP,
    summary: "Squads with players, staff and kit colours.",
    route: "/teams",
    needs: [
      {
        concept_id: ID.ORGANIZATION,
        reason: "A team is registered with an organization.",
      },
    ],
    unlocks: [
      { concept_id: ID.PLAYERS, reason: "Players join a team." },
      {
        concept_id: ID.ENTRIES,
        reason: "Teams are entered into competitions.",
      },
    ],
  },
  {
    id: ID.PLAYERS,
    name: "Players",
    lane: LANE.SETUP,
    summary: "People who play, linked to a team.",
    route: "/players",
    needs: [
      {
        concept_id: ID.TEAMS,
        reason: "A player plays for a team through a membership.",
      },
    ],
    unlocks: [
      {
        concept_id: ID.LINEUPS,
        reason: "Lineups are picked from a team's players.",
      },
    ],
  },
  {
    id: ID.OFFICIALS,
    name: "Officials",
    lane: LANE.SETUP,
    summary: "Referees, umpires and table officials.",
    route: "/officials",
    needs: [
      {
        concept_id: ID.ORGANIZATION,
        reason: "Officials are registered with an organization.",
      },
    ],
    unlocks: [
      {
        concept_id: ID.FIXTURE_SETUP,
        reason: "Officials are assigned to each game.",
      },
    ],
  },
];
