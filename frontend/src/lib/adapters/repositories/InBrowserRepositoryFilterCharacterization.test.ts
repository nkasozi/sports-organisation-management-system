import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  reset_fake_database,
  seed_fake_table,
} from "./InBrowserRepositoryFakeDatabase.test_support";
import {
  ACTIVITY_FILTER_CASES,
  CALENDAR_TOKEN_FILTER_CASES,
  COMPETITION_FORMAT_FILTER_CASES,
  type RepositoryFilterCase,
} from "./InBrowserRepositoryFilterCases.test_support";
import {
  FIXTURE_LINEUP_FILTER_CASES,
  GAME_EVENT_LOG_FILTER_CASES,
  GAME_OFFICIAL_ROLE_FILTER_CASES,
  JERSEY_COLOR_FILTER_CASES,
  LIVE_GAME_LOG_FILTER_CASES,
} from "./InBrowserRepositoryFilterCasesGameDay.test_support";
import {
  OFFICIAL_FILTER_CASES,
  PROFILE_FILTER_CASES,
  SPORT_FILTER_CASES,
  VENUE_FILTER_CASES,
} from "./InBrowserRepositoryFilterCasesPeople.test_support";

vi.mock("./database", async () => {
  const support =
    await import("./InBrowserRepositoryFakeDatabase.test_support");
  return { get_database: () => support.fake_database };
});

const ALL_FILTER_CASES: RepositoryFilterCase[] = [
  ...ACTIVITY_FILTER_CASES,
  ...CALENDAR_TOKEN_FILTER_CASES,
  ...COMPETITION_FORMAT_FILTER_CASES,
  ...FIXTURE_LINEUP_FILTER_CASES,
  ...GAME_EVENT_LOG_FILTER_CASES,
  ...GAME_OFFICIAL_ROLE_FILTER_CASES,
  ...JERSEY_COLOR_FILTER_CASES,
  ...LIVE_GAME_LOG_FILTER_CASES,
  ...OFFICIAL_FILTER_CASES,
  ...PROFILE_FILTER_CASES,
  ...SPORT_FILTER_CASES,
  ...VENUE_FILTER_CASES,
];

describe("InBrowser repository entity filters", () => {
  beforeEach(() => {
    reset_fake_database();
  });

  it.each(
    ALL_FILTER_CASES.map((filter_case) => [filter_case.name, filter_case]),
  )("%s", async (_name, filter_case) => {
    seed_fake_table(filter_case.table, filter_case.rows);

    const result = await filter_case.create().find_all(filter_case.filter);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.items.map((item) => item.id)).toEqual(
      filter_case.expected_ids,
    );
    expect(result.data.total_count).toBe(filter_case.expected_ids.length);
  });
});
