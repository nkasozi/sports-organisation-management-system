import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ANONYMOUS_IDENTITY,
  create_fake_convex_context,
  type FakeConvexContext,
  find_table_rows,
  invoke_convex_handler,
} from "./lib/fake_convex_context.test_support";
import {
  get_live_game_audience,
  leave_live_game,
  type LiveGameAudience,
  report_live_game_presence,
} from "./live_audience";

const LIVE_FIXTURE = "fixture_live";
const FINISHED_FIXTURE = "fixture_finished";
const FAN_A = "fan-aaaaaaaaaaaaaaaa";
const FAN_B = "fan-bbbbbbbbbbbbbbbb";
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
        {
          local_id: FINISHED_FIXTURE,
          organization_id: "org_a",
          status: "completed",
        },
      ],
    },
  });
}

function report(
  context: FakeConvexContext,
  viewer_key: string,
  fixture_id: string = LIVE_FIXTURE,
): Promise<string> {
  return invoke_convex_handler(report_live_game_presence, context, {
    fixture_id,
    viewer_key,
  });
}

function audience_for(
  context: FakeConvexContext,
  viewer_key: string,
): Promise<LiveGameAudience> {
  return invoke_convex_handler(get_live_game_audience, context, {
    fixture_id: LIVE_FIXTURE,
    viewer_key,
  });
}

function advance(milliseconds: number): void {
  vi.setSystemTime(Date.now() + milliseconds);
}

describe("people following a live game are counted anonymously", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(START_MS);
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("counts everyone watching and shows the others as anonymous animals", async () => {
    const context = create_context();
    await report(context, FAN_A);
    await report(context, FAN_B);

    const audience = await audience_for(context, FAN_A);

    expect(audience.watching_now).toBe(2);
    expect(audience.is_viewer_counted).toBe(true);
    expect(audience.other_faces).toHaveLength(1);
    expect(audience.other_faces[0].name).toMatch(/^Anonymous [A-Z][a-z]+$/);
    expect(JSON.stringify(audience)).not.toContain(FAN_B);
  });

  it("only counts games that are being played", async () => {
    const context = create_context();

    expect(await report(context, FAN_A, FINISHED_FIXTURE)).toBe("not_live");
    expect(await report(context, FAN_A, "fixture_missing")).toBe("not_live");
    expect(find_table_rows(context, "live_game_viewers")).toHaveLength(0);
  });

  it("refuses made-up viewer ids", async () => {
    const context = create_context();

    expect(await report(context, "x")).toBe("invalid_viewer");
  });

  it("stops counting someone who left or went quiet", async () => {
    const context = create_context();
    await report(context, FAN_A);
    await report(context, FAN_B);
    await invoke_convex_handler(leave_live_game, context, {
      fixture_id: LIVE_FIXTURE,
      viewer_key: FAN_A,
    });
    expect((await audience_for(context, FAN_A)).watching_now).toBe(1);

    advance(60_000);

    expect((await audience_for(context, FAN_A)).watching_now).toBe(0);
  });

  it("adds watch time between check-ins, capped when a tab was asleep", async () => {
    const context = create_context();
    await report(context, FAN_A);
    advance(20_000);
    await report(context, FAN_A);
    advance(10 * 60_000);
    await report(context, FAN_A);

    const [viewer] = find_table_rows(context, "live_game_viewers");
    expect(viewer.watch_ms).toBe(20_000 + 40_000);
  });
});
