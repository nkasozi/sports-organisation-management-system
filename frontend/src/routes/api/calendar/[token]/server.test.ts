import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./+server";

const { use_cases_mock, repositories_mock } = vi.hoisted(() => ({
  use_cases_mock: {
    calendar_token_use_cases: {
      get_feed_by_token: vi.fn(),
      record_feed_access: vi.fn(async () => ({ success: true, data: true })),
    },
  },
  repositories_mock: {
    organization_repository: { find_by_id: vi.fn() },
    activity_repository: { find_by_date_range: vi.fn() },
  },
}));

vi.mock("$lib/infrastructure/container", () => ({
  get_use_cases_container: () => use_cases_mock,
  get_repository_container: () => repositories_mock,
}));

vi.mock("$lib/core/services/ICalService", () => ({
  convert_activity_to_ical_event: (activity: { id: string }, org: string) => ({
    uid: activity.id,
    org,
  }),
  generate_ical_feed: (events: unknown[], config: unknown) =>
    JSON.stringify({ events, config }),
}));

const ACTIVITIES = [
  { id: "a1", team_ids: ["team-1"], competition_id: "comp-1" },
  { id: "a2", team_ids: ["team-2"], competition_id: "comp-2" },
];

function create_token(overrides: Record<string, unknown>): unknown {
  return {
    id: "token-id",
    organization_id: "org-1",
    feed_type: "all",
    entity_id: "",
    entity_name: "",
    expires_at: "2999-01-01T00:00:00.000Z",
    reminder_minutes_before: 30,
    ...overrides,
  };
}

async function call_get(token: string): Promise<Response> {
  return (await GET({ params: { token } } as never)) as Response;
}

async function read_feed(response: Response): Promise<{
  events: Array<{ uid: string; org: string }>;
  config: Record<string, unknown>;
}> {
  return JSON.parse(await response.text());
}

describe("GET /api/calendar/[token]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repositories_mock.organization_repository.find_by_id.mockResolvedValue({
      success: true,
      data: { name: "Org One" },
    });
    repositories_mock.activity_repository.find_by_date_range.mockResolvedValue({
      success: true,
      data: { items: ACTIVITIES },
    });
  });

  it("rejects malformed tokens, unknown feeds and expired feeds", async () => {
    const invalid = await call_get("bad token!.ics");
    expect(invalid.status).toBe(400);
    expect(await invalid.text()).toBe("Invalid token format");

    use_cases_mock.calendar_token_use_cases.get_feed_by_token.mockResolvedValueOnce(
      { success: false },
    );
    const missing = await call_get("abc.ics");
    expect(missing.status).toBe(404);
    expect(await missing.text()).toBe("Calendar feed not found or inactive");

    use_cases_mock.calendar_token_use_cases.get_feed_by_token.mockResolvedValueOnce(
      {
        success: true,
        data: create_token({ expires_at: "2000-01-01T00:00:00.000Z" }),
      },
    );
    const expired = await call_get("abc.ics");
    expect(expired.status).toBe(410);
    expect(await expired.text()).toBe("Calendar feed token has expired");
    expect(
      use_cases_mock.calendar_token_use_cases.record_feed_access,
    ).not.toHaveBeenCalled();
  });

  it("serves a filtered team feed named after the team", async () => {
    use_cases_mock.calendar_token_use_cases.get_feed_by_token.mockResolvedValueOnce(
      {
        success: true,
        data: create_token({
          feed_type: "team",
          entity_id: "team-1",
          entity_name: "Lions",
        }),
      },
    );
    const response = await call_get("abc.ics");
    const feed = await read_feed(response);
    const year = new Date().getFullYear();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "text/calendar; charset=utf-8",
    );
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="Lions___Team_Schedule.ics"',
    );
    expect(response.headers.get("Cache-Control")).toBe(
      "no-cache, no-store, must-revalidate",
    );
    expect(response.headers.get("Pragma")).toBe("no-cache");
    expect(response.headers.get("Expires")).toBe("0");
    expect(feed.events).toEqual([{ uid: "a1", org: "Org One" }]);
    expect(feed.config).toEqual({
      feed_name: "Lions - Team Schedule",
      organization_name: "Org One",
      timezone: "UTC",
      reminder_minutes_before: 30,
    });
    expect(
      use_cases_mock.calendar_token_use_cases.record_feed_access,
    ).toHaveBeenCalledWith("abc");
    expect(
      repositories_mock.activity_repository.find_by_date_range,
    ).toHaveBeenCalledWith("org-1", `${year}-01-01`, `${year}-12-31`, {
      page_number: 1,
      page_size: 1000,
    });
  });

  it("filters competition feeds and falls back to the default organization name", async () => {
    repositories_mock.organization_repository.find_by_id.mockResolvedValueOnce({
      success: false,
    });
    use_cases_mock.calendar_token_use_cases.get_feed_by_token.mockResolvedValueOnce(
      {
        success: true,
        data: create_token({ feed_type: "competition", entity_id: "comp-2" }),
      },
    );
    const feed = await read_feed(await call_get("abc"));

    expect(feed.events).toEqual([{ uid: "a2", org: "Sport-Sync" }]);
    expect(feed.config.feed_name).toBe("Sport-Sync Competition Schedule");
  });

  it("serves every activity for all-event feeds and a 503 instead of an empty feed when activities fail", async () => {
    use_cases_mock.calendar_token_use_cases.get_feed_by_token.mockResolvedValue(
      {
        success: true,
        data: create_token({ feed_type: "all", entity_id: "team-1" }),
      },
    );
    const full_feed = await read_feed(await call_get("abc.ics"));
    expect(full_feed.events.map((event) => event.uid)).toEqual(["a1", "a2"]);
    expect(full_feed.config.feed_name).toBe("Org One Calendar");

    vi.spyOn(console, "error").mockImplementation(() => {});
    repositories_mock.activity_repository.find_by_date_range.mockResolvedValueOnce(
      { success: false, error: "db down" },
    );
    const failed_response = await call_get("abc.ics");
    expect(failed_response.status).toBe(503);
  });
});
