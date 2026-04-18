import { afterEach, describe, expect, it, vi } from "vitest";

import type { CalendarToken } from "$lib/core/entities/CalendarToken";
import type { Competition } from "$lib/core/entities/Competition";
import type { Team } from "$lib/core/entities/Team";
import {
  parse_calendar_token_value,
  parse_entity_id,
  parse_iso_date_time_string,
  parse_name,
} from "$lib/core/types/DomainScalars";
import type { Result } from "$lib/core/types/Result";

import {
  copy_calendar_subscription_to_clipboard,
  create_calendar_subscription_feed,
  format_calendar_subscription_date,
  get_calendar_subscription_entity_options,
  get_calendar_subscription_https_url,
  get_calendar_subscription_webcal_url,
  load_calendar_subscription_manager_data,
  revoke_calendar_subscription_feed,
} from "./calendarSubscriptionManagerLogic";

function create_paginated_result<TData>(items: TData[]) {
  return {
    items,
    total_count: items.length,
    page_number: 1,
    page_size: items.length || 1,
    total_pages: 1,
  };
}

function get_success_data<TData>(result: Result<TData>): TData {
  expect(result.success).toBe(true);

  if (!result.success) {
    throw new Error("Expected a success result");
  }

  return result.data;
}

function create_team(overrides: Partial<Team> = {}): Team {
  return {
    id: "team_1",
    name: get_success_data(parse_name("Uganda Cranes")),
    ...overrides,
  } as Team;
}

function create_competition(overrides: Partial<Competition> = {}): Competition {
  return {
    id: "competition_1",
    name: get_success_data(parse_name("Easter Cup")),
    ...overrides,
  } as Competition;
}

function create_calendar_token(
  overrides: Partial<CalendarToken> = {},
): CalendarToken {
  return {
    id: get_success_data(parse_entity_id("calendar_token_1")),
    created_at: get_success_data(
      parse_iso_date_time_string("2026-04-01T00:00:00.000Z"),
    ),
    updated_at: get_success_data(
      parse_iso_date_time_string("2026-04-01T00:00:00.000Z"),
    ),
    token: get_success_data(parse_calendar_token_value("token_123")),
    user_id: get_success_data(parse_entity_id("user_1")),
    organization_id: get_success_data(parse_entity_id("org_1")),
    feed_type: "team",
    entity_id: get_success_data(parse_entity_id("team_1")),
    entity_name: get_success_data(parse_name("Uganda Cranes")),
    reminder_minutes_before: 30,
    is_active: true,
    last_accessed_at: "",
    access_count: 0,
    expires_at: "2026-07-01T00:00:00.000Z",
    ...overrides,
  } as CalendarToken;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("calendarSubscriptionManagerLogic", () => {
  it("loads subscription data and falls back to empty arrays on failed lookups", async () => {
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

    expect(result.existing_feeds).toEqual([token]);
    expect(result.teams).toEqual([]);
    expect(result.competitions).toEqual([competition]);
    expect(use_cases.team_use_cases.list).toHaveBeenCalledWith({
      organization_id: "org_1",
    });
    expect(team).toBeDefined();
  });

  it("returns empty data without calling use cases when the scope identifiers are invalid", async () => {
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
      competitions: [],
      existing_feeds: [],
      teams: [],
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

    expect(result).toEqual({ success: true, token: created_token });
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

    expect(result).toEqual({ success: false });
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

    expect(result).toEqual({ success: false });
    expect(
      use_cases.calendar_token_use_cases.create_feed,
    ).not.toHaveBeenCalled();
  });

  it("builds entity options and subscription urls for the selected feed type", () => {
    expect(
      get_calendar_subscription_entity_options({
        competitions: [create_competition()],
        selected_feed_type: "competition",
        teams: [create_team()],
      }),
    ).toEqual([{ id: "competition_1", name: "Easter Cup" }]);

    expect(
      get_calendar_subscription_entity_options({
        competitions: [create_competition()],
        selected_feed_type: "team",
        teams: [create_team()],
      }),
    ).toEqual([{ id: "team_1", name: "Uganda Cranes" }]);

    expect(
      get_calendar_subscription_https_url({
        base_url: "https://example.com",
        token: "token_123",
      }),
    ).toBe("https://example.com/api/calendar/token_123.ics");

    expect(
      get_calendar_subscription_webcal_url({
        base_url: "https://example.com",
        token: "token_123",
      }),
    ).toBe("webcal://example.com/api/calendar/token_123.ics");
  });

  it("copies subscription links to the clipboard and reports failures", async () => {
    const write_text = vi.fn().mockImplementation(async () => {});
    vi.stubGlobal("navigator", {
      clipboard: { writeText: write_text },
    });

    await expect(
      copy_calendar_subscription_to_clipboard("https://example.com/feed.ics"),
    ).resolves.toBe(true);
    expect(write_text).toHaveBeenCalledWith("https://example.com/feed.ics");

    const console_warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    write_text.mockRejectedValueOnce(new Error("clipboard denied"));

    await expect(
      copy_calendar_subscription_to_clipboard("https://example.com/feed.ics"),
    ).resolves.toBe(false);
    expect(console_warn).toHaveBeenCalled();
  });

  it("formats subscription dates and revokes feeds through the use case", async () => {
    const use_cases = {
      calendar_token_use_cases: {
        revoke_feed: vi.fn().mockResolvedValue({ success: true, data: true }),
      },
    };

    await expect(
      revoke_calendar_subscription_feed({
        token: "token_123",
        use_cases: use_cases as never,
      }),
    ).resolves.toBe(true);

    expect(format_calendar_subscription_date("")).toBe("Never");
    expect(
      format_calendar_subscription_date("2026-04-07T00:00:00.000Z"),
    ).not.toBe("Never");
  });

  it("returns false without calling revoke when the token is invalid", async () => {
    const use_cases = {
      calendar_token_use_cases: {
        revoke_feed: vi.fn(),
      },
    };

    await expect(
      revoke_calendar_subscription_feed({
        token: "invalid token",
        use_cases: use_cases as never,
      }),
    ).resolves.toBe(false);

    expect(
      use_cases.calendar_token_use_cases.revoke_feed,
    ).not.toHaveBeenCalled();
  });
});
