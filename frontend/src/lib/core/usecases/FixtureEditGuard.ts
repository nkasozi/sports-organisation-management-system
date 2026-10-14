import type { Fixture, UpdateFixtureInput } from "../entities/Fixture";
import {
  FIXTURE_STATUS,
  type FixtureStatusValue,
} from "../entities/StatusConstants";
import {
  decide_fixture_lifecycle_transition,
  FixtureLifecycleCommand,
  type FixtureLifecycleCommandValue,
  FixtureLifecycleOutcome,
} from "./FixtureLifecycleStateMachine";

export const FIXTURE_EDIT_DECISION = {
  ALLOWED: "allowed",
  REJECTED: "rejected",
} as const;

type FixtureEditDecision =
  | { kind: typeof FIXTURE_EDIT_DECISION.ALLOWED; updates: UpdateFixtureInput }
  | { kind: typeof FIXTURE_EDIT_DECISION.REJECTED; reason: string };

const FIXTURE_EDIT_MESSAGE = {
  LIVE_FIELDS_READ_ONLY:
    "Scores, game events, periods and the clock can only be changed from the live game screen.",
  STATUS_FROM_LIVE_GAME:
    "Games are started and finished from the live game screen. Here you can only postpone, cancel or reschedule a game.",
} as const;

const FIXTURE_LIVE_STATE_FIELDS = [
  "home_team_score",
  "away_team_score",
  "game_events",
  "current_period",
  "current_minute",
  "clock_status",
  "clock_elapsed_seconds",
  "clock_started_at",
  "clock_added_seconds",
  "clock_break_started_at",
  "shootout_home_score",
  "shootout_away_score",
] as const satisfies ReadonlyArray<keyof Fixture>;

const STATUS_FIELD = "status";

type StatusCommandLookup = Partial<
  Record<FixtureStatusValue, FixtureLifecycleCommandValue>
>;

const ADMINISTRATIVE_STATUS_COMMANDS: StatusCommandLookup = {
  [FIXTURE_STATUS.POSTPONED]: FixtureLifecycleCommand.POSTPONE,
  [FIXTURE_STATUS.CANCELLED]: FixtureLifecycleCommand.CANCEL,
  [FIXTURE_STATUS.SCHEDULED]: FixtureLifecycleCommand.RESCHEDULE,
};

function reject(reason: string): FixtureEditDecision {
  return { kind: FIXTURE_EDIT_DECISION.REJECTED, reason };
}

function is_same_value(left: unknown, right: unknown): boolean {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

function split_live_fields(
  existing: Fixture,
  input: UpdateFixtureInput,
): { has_changes: boolean; remaining: Record<string, unknown> } {
  const remaining: Record<string, unknown> = { ...input };
  const live_field_names: ReadonlyArray<string> = FIXTURE_LIVE_STATE_FIELDS;
  const changed_live_fields = live_field_names.filter(
    (field_name) =>
      field_name in input &&
      !is_same_value(
        remaining[field_name],
        (existing as unknown as Record<string, unknown>)[field_name],
      ),
  );
  live_field_names.forEach((field_name) => delete remaining[field_name]);
  return { has_changes: changed_live_fields.length > 0, remaining };
}

function decide_status_change(
  existing: Fixture,
  requested_status: unknown,
): FixtureEditDecision {
  const command =
    ADMINISTRATIVE_STATUS_COMMANDS[requested_status as FixtureStatusValue];
  if (!command) return reject(FIXTURE_EDIT_MESSAGE.STATUS_FROM_LIVE_GAME);
  const decision = decide_fixture_lifecycle_transition(
    existing.status,
    command,
  );
  return decision.outcome === FixtureLifecycleOutcome.ALLOWED
    ? {
        kind: FIXTURE_EDIT_DECISION.ALLOWED,
        updates: { status: decision.next_status },
      }
    : reject(decision.reason);
}

function apply_status_edit(
  existing: Fixture,
  remaining: Record<string, unknown>,
): FixtureEditDecision {
  const { [STATUS_FIELD]: requested_status, ...other_updates } = remaining;
  if (requested_status === void 0 || requested_status === existing.status)
    return {
      kind: FIXTURE_EDIT_DECISION.ALLOWED,
      updates: other_updates as UpdateFixtureInput,
    };
  const status_decision = decide_status_change(existing, requested_status);
  if (status_decision.kind === FIXTURE_EDIT_DECISION.REJECTED)
    return status_decision;
  return {
    kind: FIXTURE_EDIT_DECISION.ALLOWED,
    updates: { ...other_updates, ...status_decision.updates },
  };
}

export function decide_fixture_edit(
  existing: Fixture,
  input: UpdateFixtureInput,
): FixtureEditDecision {
  const live_fields = split_live_fields(existing, input);
  if (live_fields.has_changes)
    return reject(FIXTURE_EDIT_MESSAGE.LIVE_FIELDS_READ_ONLY);
  return apply_status_edit(existing, live_fields.remaining);
}
