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
  icon: string;
  players_on_field: number;
  game_minutes: number;
}

export const FAKE_DATA_SPORTS: readonly FakeDataSport[] = [
  {
    name: "Football",
    icon: "⚽",
    code: "FB",
    players_on_field: 11,
    game_minutes: 90,
  },
  {
    name: "Basketball",
    icon: "🏀",
    code: "BB",
    players_on_field: 5,
    game_minutes: 40,
  },
  {
    name: "Netball",
    icon: "🥅",
    code: "NB",
    players_on_field: 7,
    game_minutes: 60,
  },
  {
    name: "Rugby",
    icon: "🏉",
    code: "RU",
    players_on_field: 15,
    game_minutes: 80,
  },
  {
    name: "Hockey",
    icon: "🏑",
    code: "HK",
    players_on_field: 11,
    game_minutes: 60,
  },
  {
    name: "Volleyball",
    icon: "🏐",
    code: "VB",
    players_on_field: 6,
    game_minutes: 75,
  },
  {
    name: "Cricket",
    icon: "🏏",
    code: "CR",
    players_on_field: 11,
    game_minutes: 180,
  },
  {
    name: "Handball",
    icon: "🤾",
    code: "HB",
    players_on_field: 7,
    game_minutes: 60,
  },
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

interface FakeDataCapacityRange {
  min: number;
  max: number;
}

export const FAKE_DATA_VENUE_CAPACITY_RANGES: Readonly<
  Record<string, FakeDataCapacityRange>
> = {
  Arena: { min: 500, max: 5000 },
  "Sports Complex": { min: 500, max: 5000 },
  Grounds: { min: 1000, max: 10000 },
  Oval: { min: 1000, max: 10000 },
  Stadium: { min: 5000, max: 40000 },
};

export const FAKE_DATA_DEFAULT_VENUE_CAPACITY_RANGE: FakeDataCapacityRange = {
  min: 500,
  max: 5000,
};

export const FAKE_DATA_FIXTURE_TIME_SLOTS: readonly string[] = [
  "09:00",
  "09:30",
  "10:00",
  "11:00",
  "12:30",
  "14:00",
  "14:30",
  "15:00",
  "16:00",
  "16:30",
  "17:00",
  "18:00",
  "18:30",
  "19:00",
];

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
