type LiveClockCounters = {
  game_clock_seconds: number;
  break_elapsed_seconds: number;
};

type LiveClockProgress = {
  counters: LiveClockCounters;
  synced_at_milliseconds: number;
};

const MILLISECONDS_PER_SECOND = 1000;
const NO_WHOLE_SECONDS = 0;

export function advance_live_clock(
  counters: LiveClockCounters,
  is_period_playing: boolean,
  synced_at_milliseconds: number,
  now: Date,
): LiveClockProgress {
  const whole_seconds = Math.floor(
    (now.getTime() - synced_at_milliseconds) / MILLISECONDS_PER_SECOND,
  );
  if (whole_seconds <= NO_WHOLE_SECONDS)
    return { counters, synced_at_milliseconds };
  return {
    counters: is_period_playing
      ? {
          ...counters,
          game_clock_seconds: counters.game_clock_seconds + whole_seconds,
        }
      : {
          ...counters,
          break_elapsed_seconds: counters.break_elapsed_seconds + whole_seconds,
        },
    synced_at_milliseconds:
      synced_at_milliseconds + whole_seconds * MILLISECONDS_PER_SECOND,
  };
}
