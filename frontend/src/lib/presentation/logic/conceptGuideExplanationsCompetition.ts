import type { ConceptExplanation } from "./conceptGuideTypes";

export const COMPETITION_EXPLANATION: ConceptExplanation = {
  what_it_is:
    "A league, cup or tournament for one season, such as the National Hockey League 2026. It has a format, its rules for points and tie-breakers, and the dates it runs.",
  why_it_matters:
    "A competition is what gives games meaning. It decides how a win, draw or loss is scored, how ties are broken, and which games count towards which table.",
  scenarios: [
    {
      title: "A league season",
      story:
        "The National League runs from March to November. Every team plays each other twice, three points for a win, and goal difference breaks ties.",
    },
    {
      title: "A new season",
      story:
        "When 2027 starts you create a new competition. Last season's results stay untouched, and the same teams are entered again.",
    },
  ],
};

export const STAGES_EXPLANATION: ConceptExplanation = {
  what_it_is:
    "A phase of a competition, such as a group stage, quarter-finals or a final. A simple league has one stage.",
  why_it_matters:
    "Standings are worked out per stage. That way the group tables only count group games, and knockout games decide who goes through instead of adding points.",
  scenarios: [
    {
      title: "World Cup style",
      story:
        "The Easter Cup has two groups of four, then semi-finals and a final. The groups are one stage with their own tables; the knockouts are a second stage.",
    },
    {
      title: "A plain league",
      story:
        "The National League has a single stage, so its one table counts every game.",
    },
  ],
};

export const ENTRIES_EXPLANATION: ConceptExplanation = {
  what_it_is:
    "The list of teams taking part in a competition. A team has to be entered before it can be given fixtures in that competition.",
  why_it_matters:
    "Entries decide who appears in the standings and who can be picked when you schedule fixtures. It stops a team that isn't in the competition being given games by mistake.",
  scenarios: [
    {
      title: "Building a league",
      story:
        "Eight clubs exist in your organization, but only six play in the university championship. You enter those six, and only they can be chosen for its fixtures.",
    },
    {
      title: "A late entry",
      story:
        "A team joins after the season starts. You enter it, schedule its catch-up games, and it appears in the table from its first result.",
    },
  ],
};
