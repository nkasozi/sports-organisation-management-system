import type { ConceptExplanation } from "./conceptGuideTypes";

export const ORGANIZATION_EXPLANATION: ConceptExplanation = {
  what_it_is:
    "The body that runs your sport: a national association, a regional league, a school or a single club. It is the top of everything in SportSync.",
  why_it_matters:
    "Every team, venue, official and competition belongs to exactly one organization. That keeps your data separate from other associations, decides who can see and change what, and puts your name, logo and colours on public pages and match reports.",
  scenarios: [
    {
      title: "A national association",
      story:
        "The Uganda Hockey Association creates one organization. Its national league, its cup and its university championship all live inside it, sharing the same teams, umpires and grounds.",
    },
    {
      title: "Two associations, one system",
      story:
        "A football league and a netball league both use SportSync. Each has its own organization, so neither can see or edit the other's teams, players or fixtures.",
    },
  ],
};

export const VENUES_EXPLANATION: ConceptExplanation = {
  what_it_is:
    "A ground, pitch, court or stadium where games are played, with its address and facilities.",
  why_it_matters:
    "Fixtures point at a venue, so players, officials and fans know where to go. Picking from a list instead of typing an address avoids typos, and lets you see every game booked at a ground.",
  scenarios: [
    {
      title: "Sharing one stadium",
      story:
        "Lugogo Hockey Stadium hosts league and cup games. Because both competitions pick the same venue, the calendar shows two games booked there on the same Saturday before anyone turns up to a clash.",
    },
    {
      title: "A neutral final",
      story:
        "The cup final is played at a neutral ground. You add it as a venue once and choose it for the final fixture.",
    },
  ],
};

export const TEAMS_EXPLANATION: ConceptExplanation = {
  what_it_is:
    "A squad that competes: its name, logo, kit colours, staff and the players registered to it.",
  why_it_matters:
    "Teams are what competitions are made of. You create a team once and enter it into as many competitions as it plays in, so its results, stats and history follow it from season to season.",
  scenarios: [
    {
      title: "One team, two competitions",
      story:
        "Kampala Hockey Club plays in the National League and the Uganda Cup. It exists once, is entered into both, and its public profile shows results from each.",
    },
    {
      title: "Kit clashes",
      story:
        "Both teams in a fixture wear blue. Because each team has its kit colours saved, the fixture setup can pick a change kit for the away side.",
    },
  ],
};

export const PLAYERS_EXPLANATION: ConceptExplanation = {
  what_it_is:
    "A person who plays. A player is linked to a team through a membership that records their shirt number and when they joined.",
  why_it_matters:
    "Lineups are picked from a team's players, and every goal, card and substitution names a player. That is what produces top scorer tables, discipline records and player profiles.",
  scenarios: [
    {
      title: "A transfer mid-season",
      story:
        "Robert moves from Rockets to Weatherhead. His old membership ends and a new one starts, so his goals before the move stay with Rockets and his new goals count for Weatherhead.",
    },
    {
      title: "Picking the squad",
      story:
        "Before kick-off the team manager opens the lineup and ticks 16 of the 25 registered players. Only those 16 can be named in goals or substitutions.",
    },
  ],
};

export const OFFICIALS_EXPLANATION: ConceptExplanation = {
  what_it_is:
    "Referees, umpires, judges and table officials registered with your organization, with their qualifications.",
  why_it_matters:
    "Each game needs officials assigned before it starts. Keeping them in one list lets you share them across competitions, avoid double-booking and rate their performance afterwards.",
  scenarios: [
    {
      title: "Assigning a weekend",
      story:
        "The officials manager assigns two umpires to each of Saturday's four games. Officials appear on the match report, and each sees their games in the calendar.",
    },
    {
      title: "Reviewing performance",
      story:
        "After the final, the officials manager rates both umpires. Over a season the leaderboard shows who is ready for bigger games.",
    },
  ],
};
