import type { LiveGameAudience } from "$convex/live_audience";

export type { LiveGameAudience } from "$convex/live_audience";

export interface LiveAudienceServerPort {
  report_presence(fixture_id: string, viewer_key: string): Promise<string>;
  leave(fixture_id: string, viewer_key: string): Promise<boolean>;
  watch_audience(
    fixture_id: string,
    viewer_key: string,
    on_audience: (audience: LiveGameAudience) => void,
  ): () => void;
}

interface LiveAudienceSessionCommand {
  server: LiveAudienceServerPort;
  fixture_id: string;
  viewer_key: string;
  heartbeat_ms: number;
  on_audience: (audience: LiveGameAudience) => void;
}

export interface LiveAudienceSession {
  stop(): boolean;
}

const LIVE_AUDIENCE_EVENT = {
  STARTED: "live_audience_session_started",
  STOPPED: "live_audience_session_stopped",
  CHECK_IN_FAILED: "live_audience_check_in_failed",
  LEAVE_FAILED: "live_audience_leave_failed",
} as const;

function check_in(command: LiveAudienceSessionCommand): boolean {
  command.server
    .report_presence(command.fixture_id, command.viewer_key)
    .catch((error: unknown) =>
      console.warn("[LiveAudience] Check-in failed", {
        event: LIVE_AUDIENCE_EVENT.CHECK_IN_FAILED,
        fixture_id: command.fixture_id,
        error: String(error),
      }),
    );
  return true;
}

function leave(command: LiveAudienceSessionCommand): boolean {
  command.server
    .leave(command.fixture_id, command.viewer_key)
    .catch((error: unknown) =>
      console.warn("[LiveAudience] Leaving failed", {
        event: LIVE_AUDIENCE_EVENT.LEAVE_FAILED,
        fixture_id: command.fixture_id,
        error: String(error),
      }),
    );
  return true;
}

export function start_live_audience_session(
  command: LiveAudienceSessionCommand,
): LiveAudienceSession {
  check_in(command);
  const heartbeat = setInterval(() => check_in(command), command.heartbeat_ms);
  const stop_watching = command.server.watch_audience(
    command.fixture_id,
    command.viewer_key,
    command.on_audience,
  );
  console.log("[LiveAudience] Following the game", {
    event: LIVE_AUDIENCE_EVENT.STARTED,
    fixture_id: command.fixture_id,
  });
  let is_running = true;
  return {
    stop: (): boolean => {
      if (!is_running) return false;
      is_running = false;
      clearInterval(heartbeat);
      stop_watching();
      leave(command);
      console.log("[LiveAudience] Stopped following the game", {
        event: LIVE_AUDIENCE_EVENT.STOPPED,
        fixture_id: command.fixture_id,
      });
      return true;
    },
  };
}
