import type { ConceptExplanation } from "./conceptGuideTypes";

export const FIXTURES_EXPLANATION: ConceptExplanation = {
  what_it_is:
    "A single scheduled game: two entered teams, a date and time, a venue and the stage it belongs to.",
  why_it_matters:
    "Fixtures are the calendar of your competition. Everything on match day hangs off a fixture: its officials, both lineups, the live game and finally its result.",
  scenarios: [
    {
      title: "Planning the season",
      story:
        "You create the league's 12 games for the first round. They appear on the public calendar and on each team's profile.",
    },
    {
      title: "Rain delay",
      story:
        "A pitch is waterlogged. You move the fixture to next Sunday and a different venue, and everyone following the game sees the new date.",
    },
  ],
};

export const FIXTURE_SETUP_EXPLANATION: ConceptExplanation = {
  what_it_is:
    "The match-day details for one fixture: which officials are assigned to which role, and which jersey colours each team and the officials wear.",
  why_it_matters:
    "A game can't be run fairly without officials, and colour clashes cause confusion on the pitch and in photos. Doing it per fixture means each game gets the right people and kit.",
  scenarios: [
    {
      title: "Colour clash",
      story:
        "Rockets and Wananchi both play in red. In the setup, Wananchi is given its white away kit and the umpires wear black.",
    },
    {
      title: "Last-minute change",
      story:
        "An umpire is ill on the morning of the game. The officials manager swaps in a replacement, and the match report shows who actually officiated.",
    },
  ],
};

export const LINEUPS_EXPLANATION: ConceptExplanation = {
  what_it_is:
    "The players each team names for one fixture: who starts, who is on the bench, and their shirt numbers for the day.",
  why_it_matters:
    "During the live game, goals, cards and substitutions are recorded against lineup players. That keeps stats accurate and stops someone who isn't playing from being credited.",
  scenarios: [
    {
      title: "Team manager's job",
      story:
        "The Kampala team manager submits their lineup on Friday. The opposition does the same, and both appear on the match report.",
    },
    {
      title: "A substitution",
      story:
        "In the 60th minute a bench player comes on. Because both players are in the lineup, the substitution is recorded with one tap.",
    },
  ],
};

export const LIVE_GAME_EXPLANATION: ConceptExplanation = {
  what_it_is:
    "The screen used during a game to run the clock and periods and record goals, cards and substitutions as they happen.",
  why_it_matters:
    "It is the single source of truth for what happened. Scores update for fans watching live, and everything recorded becomes the result, the stats and the match report without anyone retyping it.",
  scenarios: [
    {
      title: "Fans following along",
      story:
        "A parent can't make the game. They open Live Games on their phone and see the score and every goal as it is recorded at the ground.",
    },
    {
      title: "A wrong call",
      story:
        "A goal is recorded against the wrong player. The scorer edits the event, the score stays right, and the audit trail records the change.",
    },
  ],
};

export const RESULTS_EXPLANATION: ConceptExplanation = {
  what_it_is:
    "What finished games produce: the final scores, the standings table, top scorers, discipline records and downloadable match reports.",
  why_it_matters:
    "You never build a table by hand. As soon as a game ends, standings and stats update using the competition's own rules, and anyone can see them on Competition Results.",
  scenarios: [
    {
      title: "Sunday evening",
      story:
        "Four games finish. The league table, the top scorer list and each team's form update at once, ready to share.",
    },
    {
      title: "A tie on points",
      story:
        "Two teams finish level. The table uses the competition's tie-breakers, such as head-to-head and goal difference, to decide who is higher.",
    },
  ],
};
