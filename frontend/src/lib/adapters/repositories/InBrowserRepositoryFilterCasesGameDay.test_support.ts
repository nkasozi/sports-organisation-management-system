import { InBrowserFixtureLineupRepository } from "./InBrowserFixtureLineupRepository";
import { get_game_event_log_repository } from "./InBrowserGameEventLogRepository";
import { InBrowserGameOfficialRoleRepository } from "./InBrowserGameOfficialRoleRepository";
import { InBrowserJerseyColorRepository } from "./InBrowserJerseyColorRepository";
import { get_live_game_log_repository } from "./InBrowserLiveGameLogRepository";
import {
  as_filterable,
  create_case_builder,
  type RepositoryFilterCase,
  row,
} from "./InBrowserRepositoryFilterCases.test_support";

const lineup_case = create_case_builder(
  "fixture lineup",
  "fixture_lineups",
  () => as_filterable(new InBrowserFixtureLineupRepository()),
  [
    row("l1", {
      organization_id: "o1",
      fixture_id: "f1",
      team_id: "t1",
      status: "draft",
      submitted_by: "u1",
    }),
    row("l2", {
      organization_id: "o2",
      fixture_id: "f2",
      team_id: "t2",
      status: "submitted",
      submitted_by: "u2",
    }),
  ],
);

export const FIXTURE_LINEUP_FILTER_CASES: RepositoryFilterCase[] = [
  lineup_case({ organization_id: "o1" }, ["l1"]),
  lineup_case({ fixture_id: "f2" }, ["l2"]),
  lineup_case({ team_id: "t1" }, ["l1"]),
  lineup_case({ status: "submitted" }, ["l2"]),
  lineup_case({ submitted_by: "u1" }, ["l1"]),
];

const event_log_case = create_case_builder(
  "game event log",
  "game_event_logs",
  () => as_filterable(get_game_event_log_repository()),
  [
    row("e1", {
      organization_id: "o1",
      live_game_log_id: "lg1",
      fixture_id: "f1",
      event_type: "goal",
      team_side: "home",
      player_id: "p1",
      secondary_player_id: "p2",
      voided: false,
    }),
    row("e2", {
      organization_id: "o2",
      live_game_log_id: "lg2",
      fixture_id: "f2",
      event_type: "yellow_card",
      team_side: "away",
      player_id: "p3",
      secondary_player_id: "",
      voided: true,
    }),
  ],
);

export const GAME_EVENT_LOG_FILTER_CASES: RepositoryFilterCase[] = [
  event_log_case({ organization_id: "o2" }, ["e2"]),
  event_log_case({ live_game_log_id: "lg1" }, ["e1"]),
  event_log_case({ fixture_id: "f2" }, ["e2"]),
  event_log_case({ event_type: "goal" }, ["e1"]),
  event_log_case({ team_side: "away" }, ["e2"]),
  event_log_case({ player_id: "p2" }, ["e1"]),
  event_log_case({ player_id: "p3" }, ["e2"]),
  event_log_case({ voided: false }, ["e1"]),
];

const role_case = create_case_builder(
  "game official role",
  "game_official_roles",
  () => as_filterable(new InBrowserGameOfficialRoleRepository()),
  [
    row("r1", {
      name: "Head Referee",
      sport_id: "s1",
      is_on_field: true,
      is_head_official: true,
      status: "active",
      organization_id: "o1",
    }),
    row("r2", {
      name: "Table Official",
      sport_id: "",
      is_on_field: false,
      is_head_official: false,
      status: "inactive",
      organization_id: "o2",
    }),
  ],
);

export const GAME_OFFICIAL_ROLE_FILTER_CASES: RepositoryFilterCase[] = [
  role_case({ name_contains: "REFEREE" }, ["r1"]),
  role_case({ sport_id: "" }, ["r2"]),
  role_case({ is_on_field: false }, ["r2"]),
  role_case({ is_head_official: true }, ["r1"]),
  role_case({ status: "inactive" }, ["r2"]),
  role_case({ organization_id: "o1" }, ["r1"]),
];

const jersey_case = create_case_builder(
  "jersey color",
  "jersey_colors",
  () => as_filterable(new InBrowserJerseyColorRepository()),
  [
    row("j1", {
      holder_type: "team",
      holder_id: "t1",
      nickname: "Home Kit",
      main_color: "#1E40AF",
      status: "active",
    }),
    row("j2", {
      holder_type: "competition_official",
      holder_id: "c1",
      nickname: "Official Uniform",
      main_color: "#000000",
      status: "inactive",
    }),
  ],
);

export const JERSEY_COLOR_FILTER_CASES: RepositoryFilterCase[] = [
  jersey_case({ holder_type: "team" }, ["j1"]),
  jersey_case({ holder_id: "c1" }, ["j2"]),
  jersey_case({ nickname: "uniform" }, ["j2"]),
  jersey_case({ main_color: "#1e40af" }, ["j1"]),
  jersey_case({ main_color: "#1E40" }, []),
  jersey_case({ status: "inactive" }, ["j2"]),
];

const live_game_case = create_case_builder(
  "live game log",
  "live_game_logs",
  () => as_filterable(get_live_game_log_repository()),
  [
    row("g1", {
      organization_id: "o1",
      fixture_id: "f1",
      game_status: "in_progress",
      started_by_user_id: "u1",
    }),
    row("g2", {
      organization_id: "o2",
      fixture_id: "f2",
      game_status: "completed",
      started_by_user_id: "u2",
    }),
  ],
);

export const LIVE_GAME_LOG_FILTER_CASES: RepositoryFilterCase[] = [
  live_game_case({ organization_id: "o2" }, ["g2"]),
  live_game_case({ fixture_id: "f1" }, ["g1"]),
  live_game_case({ game_status: "completed" }, ["g2"]),
  live_game_case({ started_by_user_id: "u1" }, ["g1"]),
];
