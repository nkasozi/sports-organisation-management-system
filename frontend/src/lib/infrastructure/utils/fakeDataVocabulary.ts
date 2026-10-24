export const FAKE_DATA_CITIES: readonly string[] = [
  "Kampala",
  "Entebbe",
  "Jinja",
  "Mbarara",
  "Gulu",
  "Mbale",
  "Masaka",
  "Lira",
  "Fort Portal",
  "Arua",
  "Soroti",
  "Hoima",
  "Mukono",
  "Wakiso",
  "Kabale",
  "Tororo",
];

export const FAKE_DATA_STREETS: readonly string[] = [
  "Kampala Road",
  "Jinja Road",
  "Bombo Road",
  "Entebbe Road",
  "Masaka Road",
  "Main Street",
  "Lugogo Bypass",
  "Station Road",
  "Market Street",
  "Stadium Road",
];

export interface FakeDataSport {
  name: string;
  code: string;
  players_on_field: number;
  game_minutes: number;
}

export const FAKE_DATA_SPORTS: readonly FakeDataSport[] = [
  { name: "Football", code: "FB", players_on_field: 11, game_minutes: 90 },
  { name: "Basketball", code: "BB", players_on_field: 5, game_minutes: 40 },
  { name: "Netball", code: "NB", players_on_field: 7, game_minutes: 60 },
  { name: "Rugby", code: "RU", players_on_field: 15, game_minutes: 80 },
  { name: "Hockey", code: "HK", players_on_field: 11, game_minutes: 60 },
  { name: "Volleyball", code: "VB", players_on_field: 6, game_minutes: 75 },
  { name: "Cricket", code: "CR", players_on_field: 11, game_minutes: 180 },
  { name: "Handball", code: "HB", players_on_field: 7, game_minutes: 60 },
];

export const FAKE_DATA_TEAM_MASCOTS: readonly string[] = [
  "Eagles",
  "Lions",
  "Cranes",
  "Leopards",
  "Kobs",
  "Rhinos",
  "Buffaloes",
  "Warriors",
  "Stars",
  "Rangers",
  "Titans",
  "Falcons",
];

export const FAKE_DATA_BODY_TYPES: readonly string[] = [
  "Association",
  "Federation",
  "Union",
  "League",
];

export const FAKE_DATA_COMPETITION_TYPES: readonly string[] = [
  "Cup",
  "League",
  "Championship",
  "Open",
  "Super League",
];

export const FAKE_DATA_VENUE_TYPES: readonly string[] = [
  "Stadium",
  "Grounds",
  "Arena",
  "Sports Complex",
  "Oval",
];

export const FAKE_DATA_LIST_ENTITY = {
  TEAM_STAFF_ROLE: "teamstaffrole",
  GAME_OFFICIAL_ROLE: "gameofficialrole",
  PLAYER_POSITION: "playerposition",
  COMPETITION_FORMAT: "competitionformat",
  COMPETITION_STAGE: "competitionstage",
  GAME_EVENT_TYPE: "gameeventtype",
  IDENTIFICATION_TYPE: "identificationtype",
  GENDER: "gender",
  COMPETITION_CONSTRAINT: "competition_constraint",
} as const;

export const FAKE_DATA_ROLE_NAMES = {
  teamstaffrole: [
    "Head Coach",
    "Assistant Coach",
    "Goalkeeping Coach",
    "Team Manager",
    "Physiotherapist",
    "Performance Analyst",
    "Team Doctor",
    "Kit Manager",
  ],
  gameofficialrole: [
    "Referee",
    "Assistant Referee",
    "Fourth Official",
    "Video Assistant Referee",
    "Umpire",
    "Line Judge",
    "Timekeeper",
    "Scorer",
  ],
  playerposition: [
    "Goalkeeper",
    "Defender",
    "Midfielder",
    "Forward",
    "Centre",
    "Wing Attack",
    "Goal Shooter",
    "Point Guard",
  ],
  competitionformat: [
    "Round Robin League",
    "Group Stage and Knockout",
    "Single Elimination Cup",
    "Double Round Robin",
  ],
  competitionstage: ["Group Stage", "Quarter Finals", "Semi Finals", "Final"],
  gameeventtype: [
    "Goal",
    "Penalty Goal",
    "Yellow Card",
    "Red Card",
    "Timeout",
    "Injury Stoppage",
  ],
  identificationtype: [
    "National ID",
    "Passport",
    "Driving Permit",
    "Student ID",
    "Club Registration Card",
  ],
  gender: ["Female", "Male", "Mixed"],
  competition_constraint: [
    "Maximum foreign players",
    "Minimum home-grown players",
    "Under-21 players on the pitch",
    "Squad registration limit",
  ],
} as const;

export type FakeDataNamedListEntity = keyof typeof FAKE_DATA_ROLE_NAMES;

export const FAKE_DATA_NOTES: readonly string[] = [
  "Checked and approved by the league office.",
  "Documents verified at registration.",
  "Follow up before the next fixture.",
  "Confirmed with the team manager by phone.",
];

export const FAKE_DATA_PREFERRED_COUNTRIES: readonly string[] = [
  "Uganda",
  "Kenya",
  "Tanzania",
  "Rwanda",
];

export const FAKE_DATA_HOME_COUNTRY = "Uganda";
