import {
  FIXTURE_STATUS,
  type FixtureStatusValue,
} from "../entities/StatusConstants";

export const FixtureLifecycleCommand = {
  START: "start",
  RECORD_EVENT: "record_event",
  CHANGE_PERIOD: "change_period",
  END: "end",
} as const;

export type FixtureLifecycleCommandValue =
  (typeof FixtureLifecycleCommand)[keyof typeof FixtureLifecycleCommand];

export const FixtureLifecycleOutcome = {
  ALLOWED: "allowed",
  REJECTED: "rejected",
} as const;

type FixtureLifecycleDecision =
  | {
      outcome: typeof FixtureLifecycleOutcome.ALLOWED;
      next_status: FixtureStatusValue;
    }
  | { outcome: typeof FixtureLifecycleOutcome.REJECTED; reason: string };

const FIXTURE_LIFECYCLE_MESSAGE = {
  CANNOT_START:
    "This game can't be started because it has already started, finished, or is not scheduled.",
  NOT_IN_PROGRESS:
    "This game is not in progress, so live changes can't be recorded. Start the game first.",
  CANNOT_END:
    "This game can only be ended while it is in progress. Start the game first.",
} as const;

function allow(next_status: FixtureStatusValue): FixtureLifecycleDecision {
  return { outcome: FixtureLifecycleOutcome.ALLOWED, next_status };
}

function reject(reason: string): FixtureLifecycleDecision {
  return { outcome: FixtureLifecycleOutcome.REJECTED, reason };
}

function decide_start(status: FixtureStatusValue): FixtureLifecycleDecision {
  switch (status) {
    case FIXTURE_STATUS.SCHEDULED:
      return allow(FIXTURE_STATUS.IN_PROGRESS);
    case FIXTURE_STATUS.IN_PROGRESS:
    case FIXTURE_STATUS.COMPLETED:
    case FIXTURE_STATUS.POSTPONED:
    case FIXTURE_STATUS.CANCELLED:
    default:
      return reject(FIXTURE_LIFECYCLE_MESSAGE.CANNOT_START);
  }
}

function decide_live_change(
  status: FixtureStatusValue,
): FixtureLifecycleDecision {
  switch (status) {
    case FIXTURE_STATUS.IN_PROGRESS:
      return allow(FIXTURE_STATUS.IN_PROGRESS);
    case FIXTURE_STATUS.SCHEDULED:
    case FIXTURE_STATUS.COMPLETED:
    case FIXTURE_STATUS.POSTPONED:
    case FIXTURE_STATUS.CANCELLED:
    default:
      return reject(FIXTURE_LIFECYCLE_MESSAGE.NOT_IN_PROGRESS);
  }
}

function decide_end(status: FixtureStatusValue): FixtureLifecycleDecision {
  switch (status) {
    case FIXTURE_STATUS.IN_PROGRESS:
      return allow(FIXTURE_STATUS.COMPLETED);
    case FIXTURE_STATUS.SCHEDULED:
    case FIXTURE_STATUS.COMPLETED:
    case FIXTURE_STATUS.POSTPONED:
    case FIXTURE_STATUS.CANCELLED:
    default:
      return reject(FIXTURE_LIFECYCLE_MESSAGE.CANNOT_END);
  }
}

export function decide_fixture_lifecycle_transition(
  status: FixtureStatusValue,
  command: FixtureLifecycleCommandValue,
): FixtureLifecycleDecision {
  switch (command) {
    case FixtureLifecycleCommand.START:
      return decide_start(status);
    case FixtureLifecycleCommand.RECORD_EVENT:
    case FixtureLifecycleCommand.CHANGE_PERIOD:
      return decide_live_change(status);
    case FixtureLifecycleCommand.END:
      return decide_end(status);
  }
}
