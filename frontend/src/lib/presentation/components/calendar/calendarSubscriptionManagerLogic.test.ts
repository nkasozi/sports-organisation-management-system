import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { parse_calendar_token_value } from "$lib/core/types/DomainScalars";

import {
  create_calendar_subscription_feed,
  load_calendar_subscription_manager_data,
} from "./calendarSubscriptionManagerLogic";
import {
  create_calendar_token,
  create_competition,
  create_paginated_result,
  create_team,
  get_success_data,
} from "./calendarSubscriptionManagerLogic.test_support";
import { CALENDAR_SUBSCRIPTION_MESSAGES } from "./calendarSubscriptionMessages";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => true);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("calendarSubscriptionManagerLogic", () => {
  it("fails with a friendly message instead of falling back when a lookup fails", async () => {
    const token = create_calendar_token();
    const team = create_team();
    const competition = create_competition();
    const use_cases = {
      calendar_token_use_cases: {
        list_user_feeds: vi.fn().mockResolvedValue({
          success: true,
          data: create_paginated_result([token]),
        }),
      },
      team_use_cases: {
        list: vi.fn().mockResolvedValue({
          success: false,
          error: "team lookup failed",
        }),
      },
      competition_use_cases: {
        list: vi.fn().mockResolvedValue({
          success: true,
          data: create_paginated_result([competition]),
        }),
      },
    };

    const result = await load_calendar_subscription_manager_data({
      organization_id: "org_1",
      user_id: "user_1",
      use_cases: use_cases as never,
    });

    expect(result).toEqual({
      success: false,
      error: CALENDAR_SUBSCRIPTION_MESSAGES.LOAD_FAILED,
    });
    expect(use_cases.team_use_cases.list).toHaveBeenCalledWith({
      organization_id: "org_1",
    });
    expect(team).toBeDefined();
  });

  it("fails without calling use cases when the scope identifiers are invalid", async () => {
    const use_cases = {
      calendar_token_use_cases: {
        list_user_feeds: vi.fn(),
      },
      team_use_cases: {
        list: vi.fn(),
      },
      competition_use_cases: {
        list: vi.fn(),
      },
    };

    const result = await load_calendar_subscription_manager_data({
      organization_id: "*",
      user_id: "",
      use_cases: use_cases as never,
    });

    expect(result).toEqual({
      success: false,
      error: CALENDAR_SUBSCRIPTION_MESSAGES.INVALID_SCOPE,
    });
    expect(
      use_cases.calendar_token_use_cases.list_user_feeds,
    ).not.toHaveBeenCalled();
    expect(use_cases.team_use_cases.list).not.toHaveBeenCalled();
    expect(use_cases.competition_use_cases.list).not.toHaveBeenCalled();
  });

  it("creates a feed using the resolved entity name and returns the token", async () => {
    const created_token = create_calendar_token({
      token: get_success_data(parse_calendar_token_value("created_token")),
    });
    const use_cases = {
      calendar_token_use_cases: {
        create_feed: vi.fn().mockResolvedValue({
          success: true,
          data: { token: created_token },
        }),
      },
    };

    const result = await create_calendar_subscription_feed({
      competitions: [],
      organization_id: "org_1",
      reminder_minutes: 60,
      selected_entity_id: "team_1",
      selected_feed_type: "team",
      teams: [create_team()],
      user_id: "user_1",
      use_cases: use_cases as never,
    });

    expect(result).toEqual({ success: true, data: created_token });
    expect(use_cases.calendar_token_use_cases.create_feed).toHaveBeenCalledWith(
      "user_1",
      "org_1",
      "team",
      "team_1",
      "Uganda Cranes",
      60,
    );
  });

  it("returns a failure result when feed creation fails", async () => {
    const use_cases = {
      calendar_token_use_cases: {
        create_feed: vi.fn().mockResolvedValue({
          success: false,
          error: "creation failed",
        }),
      },
    };

    const result = await create_calendar_subscription_feed({
      competitions: [],
      organization_id: "org_1",
      reminder_minutes: 15,
      selected_entity_id: "",
      selected_feed_type: "all",
      teams: [],
      user_id: "user_1",
      use_cases: use_cases as never,
    });

    expect(result).toEqual({
      success: false,
      error: CALENDAR_SUBSCRIPTION_MESSAGES.CREATE_FAILED,
    });
  });

  it("returns a failure result without calling the use case when the selected entity id is invalid", async () => {
    const use_cases = {
      calendar_token_use_cases: {
        create_feed: vi.fn(),
      },
    };

    const result = await create_calendar_subscription_feed({
      competitions: [],
      organization_id: "org_1",
      reminder_minutes: 15,
      selected_entity_id: "",
      selected_feed_type: "team",
      teams: [create_team()],
      user_id: "user_1",
      use_cases: use_cases as never,
    });

    expect(result).toEqual({
      success: false,
      error: CALENDAR_SUBSCRIPTION_MESSAGES.CREATE_FAILED,
    });
    expect(
      use_cases.calendar_token_use_cases.create_feed,
    ).not.toHaveBeenCalled();
  });
});
