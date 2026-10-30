import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  type LiveAudienceServerPort,
  type LiveGameAudience,
  start_live_audience_session,
} from "./liveAudienceSession";
import { read_device_viewer_key } from "./liveAudienceViewerKey";

const AUDIENCE: LiveGameAudience = {
  watching_now: 2,
  is_viewer_counted: true,
  other_faces: [{ name: "Anonymous Crane", color_index: 3 }],
};

function create_server(): LiveAudienceServerPort & {
  unsubscribe: ReturnType<typeof vi.fn>;
} {
  const unsubscribe = vi.fn();
  return {
    unsubscribe,
    report_presence: vi.fn(async () => "counted"),
    leave: vi.fn(async () => true),
    watch_audience: vi.fn((_fixture_id, _viewer_key, on_audience) => {
      on_audience(AUDIENCE);
      return unsubscribe;
    }),
  };
}

describe("following a live game", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("checks in straight away and again on every heartbeat", () => {
    const server = create_server();
    const on_audience = vi.fn();
    start_live_audience_session({
      server,
      fixture_id: "fixture_1",
      viewer_key: "viewer-1",
      heartbeat_ms: 20_000,
      on_audience,
    });

    vi.advanceTimersByTime(40_000);

    expect(server.report_presence).toHaveBeenCalledTimes(3);
    expect(on_audience).toHaveBeenCalledWith(AUDIENCE);
  });

  it("stops checking in and tells the server it left, once", () => {
    const server = create_server();
    const session = start_live_audience_session({
      server,
      fixture_id: "fixture_1",
      viewer_key: "viewer-1",
      heartbeat_ms: 20_000,
      on_audience: vi.fn(),
    });

    expect(session.stop()).toBe(true);
    expect(session.stop()).toBe(false);
    vi.advanceTimersByTime(60_000);

    expect(server.report_presence).toHaveBeenCalledTimes(1);
    expect(server.unsubscribe).toHaveBeenCalledTimes(1);
    expect(server.leave).toHaveBeenCalledWith("fixture_1", "viewer-1");
  });
});

describe("the anonymous device id", () => {
  it("is created once and reused on the same device", () => {
    const saved = new Map<string, string>();
    const storage = {
      getItem: (key: string) => saved.get(key) ?? "",
      setItem: (key: string, value: string) => void saved.set(key, value),
    } as Pick<Storage, "getItem" | "setItem">;

    const first = read_device_viewer_key(storage);

    expect(first).toMatch(/^viewer-[0-9a-f-]{36}$/);
    expect(read_device_viewer_key(storage)).toBe(first);
  });

  it("still works when the browser blocks storage", () => {
    const blocked = {
      getItem: undefined,
      setItem: undefined,
    } as unknown as Pick<Storage, "getItem" | "setItem">;

    const key = read_device_viewer_key(blocked);

    expect(key).toMatch(/^viewer-/);
    expect(read_device_viewer_key(blocked)).toBe(key);
  });
});
