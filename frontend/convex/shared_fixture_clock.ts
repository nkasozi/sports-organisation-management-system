export const FIXTURE_CLOCK_STATUS = {
  STOPPED: "stopped",
  RUNNING: "running",
} as const;

export type FixtureClockStatus =
  (typeof FIXTURE_CLOCK_STATUS)[keyof typeof FIXTURE_CLOCK_STATUS];
