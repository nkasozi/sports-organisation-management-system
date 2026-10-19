import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  keep_local_unlock_session_alive,
  type LocalUnlockSessionKeeperPorts,
} from "./localUnlockSessionKeeper";

const HEARTBEAT_MILLISECONDS = 20_000;

interface KeeperTestRig {
  ports: LocalUnlockSessionKeeperPorts;
  document_events: EventTarget;
  window_events: EventTarget;
  page_state: { is_in_sight: boolean; has_session: boolean };
  announce_session_ended(): boolean;
  is_channel_closed(): boolean;
}

function create_keeper_rig(): KeeperTestRig {
  const document_events = new EventTarget();
  const window_events = new EventTarget();
  const page_state = { is_in_sight: true, has_session: true };
  const channel = { on_ended: () => false, is_closed: false };
  const ports: LocalUnlockSessionKeeperPorts = {
    beat_unlock_session: vi.fn(async () => create_success_result(true)),
    has_unlock_session: () => page_state.has_session,
    is_page_in_sight: () => page_state.is_in_sight,
    forget_data_key: vi.fn(() => true),
    reload_page: vi.fn(() => true),
    listen_for_session_ended: (on_ended: () => boolean) => {
      channel.on_ended = on_ended;
      return () => {
        channel.is_closed = true;
        return true;
      };
    },
    document_events,
    window_events,
    heartbeat_milliseconds: HEARTBEAT_MILLISECONDS,
  };
  return {
    ports,
    document_events,
    window_events,
    page_state,
    announce_session_ended: () => channel.on_ended(),
    is_channel_closed: () => channel.is_closed,
  };
}

describe("keeping the unlock session alive", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("beats every twenty seconds, noting whether the page is in sight", async () => {
    const rig = create_keeper_rig();
    keep_local_unlock_session_alive(rig.ports);

    await vi.advanceTimersByTimeAsync(HEARTBEAT_MILLISECONDS);
    rig.page_state.is_in_sight = false;
    await vi.advanceTimersByTimeAsync(HEARTBEAT_MILLISECONDS);

    expect(rig.ports.beat_unlock_session).toHaveBeenNthCalledWith(1, true);
    expect(rig.ports.beat_unlock_session).toHaveBeenNthCalledWith(2, false);
    expect(rig.ports.reload_page).not.toHaveBeenCalled();
  });

  it("beats when the page is hidden, shown or closed", async () => {
    const rig = create_keeper_rig();
    keep_local_unlock_session_alive(rig.ports);

    rig.document_events.dispatchEvent(new Event("visibilitychange"));
    rig.window_events.dispatchEvent(new Event("pagehide"));
    await vi.advanceTimersByTimeAsync(0);

    expect(rig.ports.beat_unlock_session).toHaveBeenCalledTimes(2);
  });

  it("locks this tab once when a beat finds the session over", async () => {
    const rig = create_keeper_rig();
    vi.mocked(rig.ports.beat_unlock_session).mockResolvedValue(
      create_success_result(false),
    );
    keep_local_unlock_session_alive(rig.ports);

    await vi.advanceTimersByTimeAsync(HEARTBEAT_MILLISECONDS * 2);

    expect(rig.ports.forget_data_key).toHaveBeenCalledTimes(1);
    expect(rig.ports.reload_page).toHaveBeenCalledTimes(1);
  });

  it("keeps the tab unlocked when a beat cannot reach storage", async () => {
    const rig = create_keeper_rig();
    vi.mocked(rig.ports.beat_unlock_session).mockResolvedValue(
      create_failure_result("disk busy"),
    );
    keep_local_unlock_session_alive(rig.ports);

    await vi.advanceTimersByTimeAsync(HEARTBEAT_MILLISECONDS);

    expect(rig.ports.reload_page).not.toHaveBeenCalled();
  });

  it("locks this tab when another tab ends the session", () => {
    const rig = create_keeper_rig();
    keep_local_unlock_session_alive(rig.ports);

    expect(rig.announce_session_ended()).toBe(true);
    expect(rig.ports.forget_data_key).toHaveBeenCalledTimes(1);
    expect(rig.ports.reload_page).toHaveBeenCalledTimes(1);
  });

  it("does nothing on a lock message while the device key is in use", () => {
    const rig = create_keeper_rig();
    rig.page_state.has_session = false;
    keep_local_unlock_session_alive(rig.ports);

    expect(rig.announce_session_ended()).toBe(false);
    expect(rig.ports.forget_data_key).not.toHaveBeenCalled();
    expect(rig.ports.reload_page).not.toHaveBeenCalled();
  });

  it("stops beating and listening once stopped", async () => {
    const rig = create_keeper_rig();
    const stop = keep_local_unlock_session_alive(rig.ports);

    expect(stop()).toBe(true);
    rig.document_events.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(HEARTBEAT_MILLISECONDS * 3);

    expect(rig.ports.beat_unlock_session).not.toHaveBeenCalled();
    expect(rig.is_channel_closed()).toBe(true);
    expect(rig.announce_session_ended()).toBe(false);
  });
});
