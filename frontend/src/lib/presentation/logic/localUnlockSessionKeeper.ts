import type { AsyncResult } from "$lib/core/types/Result";

export interface LocalUnlockSessionKeeperPorts {
  beat_unlock_session(is_in_sight: boolean): AsyncResult<boolean>;
  has_unlock_session(): boolean;
  is_page_in_sight(): boolean;
  forget_data_key(): boolean;
  reload_page(): boolean;
  listen_for_session_ended(on_ended: () => boolean): () => boolean;
  document_events: EventTarget;
  window_events: EventTarget;
  heartbeat_milliseconds: number;
}

const KEEPER_STATE = {
  WATCHING: "watching",
  LOCKING: "locking",
  STOPPED: "stopped",
} as const;

type KeeperState = (typeof KEEPER_STATE)[keyof typeof KEEPER_STATE];

const KEEPER_EVENT = {
  SESSION_ENDED: "session_ended",
  STOP_REQUESTED: "stop_requested",
} as const;

type KeeperEvent = (typeof KEEPER_EVENT)[keyof typeof KEEPER_EVENT];

const TAB_LOCK_REASON = {
  SESSION_EXPIRED: "session_expired",
  ENDED_IN_ANOTHER_TAB: "ended_in_another_tab",
} as const;

type TabLockReason = (typeof TAB_LOCK_REASON)[keyof typeof TAB_LOCK_REASON];

const VISIBILITY_CHANGE_EVENT_NAME = "visibilitychange";
const PAGE_HIDE_EVENT_NAME = "pagehide";
const TAB_LOCKED_EVENT = "local_unlock_session_tab_locked";
const BEAT_FAILED_EVENT = "local_unlock_session_beat_failed";

function advance_keeper_state(
  current_state: KeeperState,
  event: KeeperEvent,
): KeeperState {
  switch (current_state) {
    case KEEPER_STATE.WATCHING:
      return event === KEEPER_EVENT.SESSION_ENDED
        ? KEEPER_STATE.LOCKING
        : KEEPER_STATE.STOPPED;
    case KEEPER_STATE.LOCKING:
      return event === KEEPER_EVENT.STOP_REQUESTED
        ? KEEPER_STATE.STOPPED
        : KEEPER_STATE.LOCKING;
    case KEEPER_STATE.STOPPED:
      return KEEPER_STATE.STOPPED;
  }
}

interface KeeperStateHolder {
  current: KeeperState;
}

function lock_this_tab(
  ports: LocalUnlockSessionKeeperPorts,
  holder: KeeperStateHolder,
  reason: TabLockReason,
): boolean {
  if (holder.current !== KEEPER_STATE.WATCHING) return false;
  holder.current = advance_keeper_state(
    holder.current,
    KEEPER_EVENT.SESSION_ENDED,
  );
  console.info("[LocalVault] Unlock session over, locking this tab", {
    event: TAB_LOCKED_EVENT,
    reason,
  });
  ports.forget_data_key();
  return ports.reload_page();
}

async function beat_once(
  ports: LocalUnlockSessionKeeperPorts,
  holder: KeeperStateHolder,
): Promise<boolean> {
  if (holder.current !== KEEPER_STATE.WATCHING) return false;
  const beat_result = await ports.beat_unlock_session(ports.is_page_in_sight());
  if (!beat_result.success) {
    console.warn("[LocalVault] Unlock session heartbeat failed", {
      event: BEAT_FAILED_EVENT,
      error: beat_result.error,
    });
    return false;
  }
  return (
    beat_result.data ||
    lock_this_tab(ports, holder, TAB_LOCK_REASON.SESSION_EXPIRED)
  );
}

function handle_session_ended_elsewhere(
  ports: LocalUnlockSessionKeeperPorts,
  holder: KeeperStateHolder,
): boolean {
  if (!ports.has_unlock_session()) return false;
  return lock_this_tab(ports, holder, TAB_LOCK_REASON.ENDED_IN_ANOTHER_TAB);
}

export function keep_local_unlock_session_alive(
  ports: LocalUnlockSessionKeeperPorts,
): () => boolean {
  const holder: KeeperStateHolder = { current: KEEPER_STATE.WATCHING };
  const beat = (): void => {
    void beat_once(ports, holder);
  };
  const stop_listening = ports.listen_for_session_ended(() =>
    handle_session_ended_elsewhere(ports, holder),
  );
  const heartbeat_id = setInterval(beat, ports.heartbeat_milliseconds);
  ports.document_events.addEventListener(VISIBILITY_CHANGE_EVENT_NAME, beat);
  ports.window_events.addEventListener(PAGE_HIDE_EVENT_NAME, beat);
  return () => {
    holder.current = advance_keeper_state(
      holder.current,
      KEEPER_EVENT.STOP_REQUESTED,
    );
    clearInterval(heartbeat_id);
    ports.document_events.removeEventListener(
      VISIBILITY_CHANGE_EVENT_NAME,
      beat,
    );
    ports.window_events.removeEventListener(PAGE_HIDE_EVENT_NAME, beat);
    return stop_listening();
  };
}
