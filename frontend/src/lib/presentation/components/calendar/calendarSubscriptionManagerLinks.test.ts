import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  copy_calendar_subscription_to_clipboard,
  format_calendar_subscription_date,
  get_calendar_subscription_entity_options,
  get_calendar_subscription_https_url,
  get_calendar_subscription_webcal_url,
  revoke_calendar_subscription_feed,
} from "./calendarSubscriptionManagerLogic";
import {
  create_competition,
  create_team,
} from "./calendarSubscriptionManagerLogic.test_support";
import { CALENDAR_SUBSCRIPTION_MESSAGES } from "./calendarSubscriptionMessages";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => true);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("calendarSubscriptionManagerLogic links and revocation", () => {
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
    ).resolves.toEqual({ success: true, data: true });

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
    ).resolves.toEqual({
      success: false,
      error: CALENDAR_SUBSCRIPTION_MESSAGES.REVOKE_FAILED,
    });

    expect(
      use_cases.calendar_token_use_cases.revoke_feed,
    ).not.toHaveBeenCalled();
  });
});
