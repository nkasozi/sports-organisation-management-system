import { describe, expect, it } from "vitest";

import { get_calendar_feed_by_token } from "./calendar_feed";
import {
  ANONYMOUS_IDENTITY,
  create_fake_convex_context,
  invoke_convex_handler,
} from "./lib/fake_convex_context.test_support";

const YEAR = new Date().getUTCFullYear();
const FUTURE = `${YEAR + 5}-01-01T00:00:00.000Z`;

type FeedResult = {
  status: string;
  feed?: { organization_name: string; events: Array<Record<string, unknown>> };
};

function token(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    local_id: "tok",
    token: "secret",
    user_id: "user_1",
    organization_id: "org_a",
    feed_type: "all",
    entity_id: "",
    entity_name: "",
    reminder_minutes_before: 15,
    is_active: true,
    expires_at: FUTURE,
    ...overrides,
  };
}

function activity(
  local_id: string,
  overrides: Record<string, unknown>,
): Record<string, unknown> {
  return {
    local_id,
    title: `Activity ${local_id}`,
    organization_id: "org_a",
    start_datetime: `${YEAR}-06-01T10:00:00.000Z`,
    end_datetime: `${YEAR}-06-01T12:00:00.000Z`,
    notes: "private coach notes",
    team_ids: [],
    ...overrides,
  };
}

async function read_feed(
  stored_token: Record<string, unknown>,
): Promise<FeedResult> {
  const context = create_fake_convex_context({
    identity: ANONYMOUS_IDENTITY,
    tables: {
      calendar_tokens: [stored_token],
      organizations: [{ local_id: "org_a", name: "Org A" }],
      player_team_memberships: [
        { local_id: "m1", player_id: "player_1", team_id: "team_1" },
      ],
      activities: [
        activity("a_team_1", { team_ids: ["team_1"] }),
        activity("a_team_2", { team_ids: ["team_2"], competition_id: "c1" }),
        activity("a_other_org", {
          organization_id: "org_b",
          team_ids: ["team_1"],
        }),
      ],
    },
  });
  return invoke_convex_handler<FeedResult>(
    get_calendar_feed_by_token,
    context,
    {
      token: "secret",
    },
  );
}

function event_ids(result: FeedResult): unknown[] {
  return (result.feed?.events ?? []).map((event) => event.local_id);
}

describe("get_calendar_feed_by_token", () => {
  it("rejects unknown, inactive and expired tokens", async () => {
    expect((await read_feed(token({ token: "other" }))).status).toBe(
      "not_found",
    );
    expect((await read_feed(token({ is_active: false }))).status).toBe(
      "not_found",
    );
    expect(
      (await read_feed(token({ expires_at: "2000-01-01T00:00:00.000Z" })))
        .status,
    ).toBe("expired");
  });

  it("scopes a player feed to the player's teams only", async () => {
    const result = await read_feed(
      token({ feed_type: "player", entity_id: "player_1" }),
    );
    expect(event_ids(result)).toEqual(["a_team_1"]);
  });

  it("returns no events for entity feeds without an entity", async () => {
    for (const feed_type of ["player", "team", "competition"]) {
      expect(event_ids(await read_feed(token({ feed_type })))).toEqual([]);
    }
  });

  it("scopes team and competition feeds and never leaks other organizations", async () => {
    expect(
      event_ids(
        await read_feed(token({ feed_type: "team", entity_id: "team_1" })),
      ),
    ).toEqual(["a_team_1"]);
    expect(
      event_ids(
        await read_feed(token({ feed_type: "competition", entity_id: "c1" })),
      ),
    ).toEqual(["a_team_2"]);
    expect(event_ids(await read_feed(token({})))).toEqual([
      "a_team_1",
      "a_team_2",
    ]);
  });

  it("returns only non-sensitive event fields", async () => {
    const result = await read_feed(token({}));
    expect(result.feed?.organization_name).toBe("Org A");
    expect(result.feed?.events[0]).not.toHaveProperty("notes");
    expect(result.feed).not.toHaveProperty("user_id");
    expect(result.feed).not.toHaveProperty("token");
  });
});
