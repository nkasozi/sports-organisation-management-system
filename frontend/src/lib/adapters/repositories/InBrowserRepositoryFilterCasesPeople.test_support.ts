import { InBrowserOfficialRepository } from "./InBrowserOfficialRepository";
import { InBrowserPlayerProfileRepository } from "./InBrowserPlayerProfileRepository";
import {
  as_filterable,
  create_case_builder,
  type RepositoryFilterCase,
  row,
} from "./InBrowserRepositoryFilterCases.test_support";
import { get_sport_repository } from "./InBrowserSportRepository";
import { InBrowserTeamProfileRepository } from "./InBrowserTeamProfileRepository";
import { InBrowserVenueRepository } from "./InBrowserVenueRepository";

const official_case = create_case_builder(
  "official",
  "officials",
  () => as_filterable(new InBrowserOfficialRepository()),
  [
    row("o_1", {
      first_name: "James",
      last_name: "Mukasa",
      organization_id: "org1",
      status: "active",
    }),
    row("o_2", {
      first_name: "Sarah",
      last_name: "Nakato",
      organization_id: "org2",
      status: "inactive",
    }),
  ],
);

export const OFFICIAL_FILTER_CASES: RepositoryFilterCase[] = [
  official_case({ name_contains: "james muk" }, ["o_1"]),
  official_case({ name_contains: "NAKATO" }, ["o_2"]),
  official_case({ organization_id: "org1" }, ["o_1"]),
  official_case({ status: "inactive" }, ["o_2"]),
];

const PROFILE_FIELDS = [
  { visibility: "public", status: "active" },
  { visibility: "private", status: "inactive" },
];

const player_profile_case = create_case_builder(
  "player profile",
  "player_profiles",
  () => as_filterable(new InBrowserPlayerProfileRepository()),
  [
    row("pp1", { player_id: "p1", ...PROFILE_FIELDS[0] }),
    row("pp2", { player_id: "p2", ...PROFILE_FIELDS[1] }),
  ],
);

const team_profile_case = create_case_builder(
  "team profile",
  "team_profiles",
  () => as_filterable(new InBrowserTeamProfileRepository()),
  [
    row("tp1", { team_id: "t1", ...PROFILE_FIELDS[0] }),
    row("tp2", { team_id: "t2", ...PROFILE_FIELDS[1] }),
  ],
);

export const PROFILE_FILTER_CASES: RepositoryFilterCase[] = [
  player_profile_case({ player_id: "p2" }, ["pp2"]),
  player_profile_case({ visibility: "public" }, ["pp1"]),
  player_profile_case({ status: "inactive" }, ["pp2"]),
  team_profile_case({ team_id: "t1" }, ["tp1"]),
  team_profile_case({ visibility: "private" }, ["tp2"]),
  team_profile_case({ status: "active" }, ["tp1"]),
];

const sport_case = create_case_builder(
  "sport",
  "sports",
  () => as_filterable(get_sport_repository()),
  [
    row("s1", { name: "Field Hockey", status: "active" }),
    row("s2", { name: "Football", status: "inactive" }),
  ],
);

export const SPORT_FILTER_CASES: RepositoryFilterCase[] = [
  sport_case({ name_contains: "hockey" }, ["s1"]),
  sport_case({ status: "inactive" }, ["s2"]),
];

const venue_case = create_case_builder(
  "venue",
  "venues",
  () => as_filterable(new InBrowserVenueRepository()),
  [
    row("v1", {
      name: "Lugogo Stadium",
      city: "Kampala",
      country: "Uganda",
      status: "active",
    }),
    row("v2", {
      name: "Nyayo Stadium",
      city: "Nairobi",
      country: "Kenya",
      status: "inactive",
    }),
  ],
);

export const VENUE_FILTER_CASES: RepositoryFilterCase[] = [
  venue_case({ name_contains: "LUGOGO" }, ["v1"]),
  venue_case({ city: "Nairobi" }, ["v2"]),
  venue_case({ country: "Uganda" }, ["v1"]),
  venue_case({ status: "inactive" }, ["v2"]),
];
