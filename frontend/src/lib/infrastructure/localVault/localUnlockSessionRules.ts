export interface LocalUnlockSessionTimes {
  last_seen_at: number;
  last_in_sight_at: number;
}

const MILLISECONDS_PER_SECOND = 1000;
const MILLISECONDS_PER_MINUTE = 60 * MILLISECONDS_PER_SECOND;
const AWAY_LIMIT_MINUTES = 30;
const CLOSED_LIMIT_MINUTES = 5;
const HEARTBEAT_SECONDS = 20;

const AWAY_LIMIT_MILLISECONDS = AWAY_LIMIT_MINUTES * MILLISECONDS_PER_MINUTE;
const CLOSED_LIMIT_MILLISECONDS =
  CLOSED_LIMIT_MINUTES * MILLISECONDS_PER_MINUTE;

export const LOCAL_UNLOCK_SESSION_HEARTBEAT_MILLISECONDS =
  HEARTBEAT_SECONDS * MILLISECONDS_PER_SECOND;

export function has_been_away_too_long(
  times: LocalUnlockSessionTimes,
  now: number,
): boolean {
  return now - times.last_in_sight_at > AWAY_LIMIT_MILLISECONDS;
}

function was_closed(times: LocalUnlockSessionTimes, now: number): boolean {
  return now - times.last_seen_at > CLOSED_LIMIT_MILLISECONDS;
}

export function can_resume_local_unlock_session(
  times: LocalUnlockSessionTimes,
  now: number,
): boolean {
  return !was_closed(times, now) && !has_been_away_too_long(times, now);
}

export function mark_local_unlock_session_seen(
  times: LocalUnlockSessionTimes,
  now: number,
  is_in_sight: boolean,
): LocalUnlockSessionTimes {
  return {
    last_seen_at: Math.max(times.last_seen_at, now),
    last_in_sight_at: is_in_sight
      ? Math.max(times.last_in_sight_at, now)
      : times.last_in_sight_at,
  };
}
