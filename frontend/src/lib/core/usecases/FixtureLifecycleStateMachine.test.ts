import { describe, expect, it } from "vitest";

import { FIXTURE_STATUS } from "../entities/StatusConstants";
import {
  decide_fixture_lifecycle_transition,
  FixtureLifecycleCommand,
  FixtureLifecycleOutcome,
} from "./FixtureLifecycleStateMachine";

const ALL_STATUSES = Object.values(FIXTURE_STATUS);

const ALLOWED_TRANSITIONS = [
  [
    FixtureLifecycleCommand.START,
    FIXTURE_STATUS.SCHEDULED,
    FIXTURE_STATUS.IN_PROGRESS,
  ],
  [
    FixtureLifecycleCommand.RECORD_EVENT,
    FIXTURE_STATUS.IN_PROGRESS,
    FIXTURE_STATUS.IN_PROGRESS,
  ],
  [
    FixtureLifecycleCommand.CHANGE_PERIOD,
    FIXTURE_STATUS.IN_PROGRESS,
    FIXTURE_STATUS.IN_PROGRESS,
  ],
  [
    FixtureLifecycleCommand.END,
    FIXTURE_STATUS.IN_PROGRESS,
    FIXTURE_STATUS.COMPLETED,
  ],
  [
    FixtureLifecycleCommand.POSTPONE,
    FIXTURE_STATUS.SCHEDULED,
    FIXTURE_STATUS.POSTPONED,
  ],
  [
    FixtureLifecycleCommand.CANCEL,
    FIXTURE_STATUS.SCHEDULED,
    FIXTURE_STATUS.CANCELLED,
  ],
  [
    FixtureLifecycleCommand.CANCEL,
    FIXTURE_STATUS.POSTPONED,
    FIXTURE_STATUS.CANCELLED,
  ],
  [
    FixtureLifecycleCommand.RESCHEDULE,
    FIXTURE_STATUS.POSTPONED,
    FIXTURE_STATUS.SCHEDULED,
  ],
] as const;

describe("decide_fixture_lifecycle_transition", () => {
  it.each(ALLOWED_TRANSITIONS)(
    "allows %s from %s",
    (command, status, next_status) => {
      expect(decide_fixture_lifecycle_transition(status, command)).toEqual({
        outcome: FixtureLifecycleOutcome.ALLOWED,
        next_status,
      });
    },
  );

  it.each(Object.values(FixtureLifecycleCommand))(
    "rejects %s from every other status with a friendly reason",
    (command) => {
      const allowed_from = ALLOWED_TRANSITIONS.filter(
        ([allowed_command]) => allowed_command === command,
      ).map(([, status]) => status as string);
      const rejected_statuses = ALL_STATUSES.filter(
        (status) => !allowed_from.includes(status),
      );
      for (const status of rejected_statuses) {
        const decision = decide_fixture_lifecycle_transition(status, command);
        expect(decision.outcome).toBe(FixtureLifecycleOutcome.REJECTED);
        expect(
          decision.outcome === FixtureLifecycleOutcome.REJECTED &&
            decision.reason.length > 0,
        ).toBe(true);
      }
    },
  );

  it("rejects unknown statuses", () => {
    expect(
      decide_fixture_lifecycle_transition(
        "mystery" as never,
        FixtureLifecycleCommand.START,
      ).outcome,
    ).toBe(FixtureLifecycleOutcome.REJECTED);
  });
});
