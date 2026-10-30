import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ANONYMOUS_IDENTITY,
  create_fake_convex_context,
  type FakeConvexContext,
  find_table_rows,
  invoke_convex_handler,
} from "./lib/fake_convex_context.test_support";
import { leave_live_game, report_live_game_presence } from "./live_audience";
import {
  get_live_game_viewer_stats,
  type LiveGameViewerStats,
  prune_old_live_game_viewers,
  refresh_live_game_viewer_stats,
} from "./live_audience_stats";

const LIVE_FIXTURE = "fixture_live";
const FANS = [
  "fan-aaaaaaaaaaaaaaaa",
  "fan-bbbbbbbbbbbbbbbb",
  "fan-cccccccccccccccc",
];
const START_MS = Date.parse("2026-10-30T15:00:00.000Z");

function create_context(): FakeConvexContext {
  return create_fake_convex_context({
    identity: ANONYMOUS_IDENTITY,
    tables: {
      fixtures: [
        {
          local_id: LIVE_FIXTURE,
          organization_id: "org_a",
          status: "in_progress",
        },
      ],
    },
  });
}

async function report_all(
  context: FakeConvexContext,
  viewer_keys: string[],
): Promise<void> {
  for (const viewer_key of viewer_keys)
    await invoke_convex_handler(report_live_game_presence, context, {
      fixture_id: LIVE_FIXTURE,
      viewer_key,
    });
}

function refresh(context: FakeConvexContext): Promise<number> {
  return invoke_convex_handler(refresh_live_game_viewer_stats, context, {});
}

function read_stats(context: FakeConvexContext): Promise<LiveGameViewerStats> {
  return invoke_convex_handler(get_live_game_viewer_stats, context, {
    fixture_id: LIVE_FIXTURE,
  });
}

function advance(milliseconds: number): void {
  vi.setSystemTime(Date.now() + milliseconds);
}

describe("each game keeps its live audience stats", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(START_MS);
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("has no stats for a game nobody followed", async () => {
    expect(await read_stats(create_context())).toEqual({ status: "none" });
  });

  it("keeps the peak, the people who followed and the time they watched", async () => {
    const context = create_context();
    await report_all(context, FANS);
    advance(20_000);
    await report_all(context, FANS);
    await refresh(context);
    for (const viewer_key of FANS.slice(1))
      await invoke_convex_handler(leave_live_game, context, {
        fixture_id: LIVE_FIXTURE,
        viewer_key,
      });
    advance(60_000);
    await report_all(context, FANS.slice(0, 1));
    await refresh(context);

    expect(await read_stats(context)).toEqual({
      status: "present",
      unique_viewers: 3,
      peak_viewers: 3,
      total_watch_minutes: 2,
    });
  });

  it("clears old check-ins but keeps the saved stats", async () => {
    const context = create_context();
    await report_all(context, FANS);
    await refresh(context);
    advance(4 * 24 * 60 * 60_000);

    await invoke_convex_handler(prune_old_live_game_viewers, context, {});

    expect(find_table_rows(context, "live_game_viewers")).toHaveLength(0);
    expect(await read_stats(context)).toMatchObject({
      status: "present",
      unique_viewers: 3,
    });
  });
});
