import type {
  FixtureLineup,
  UpdateFixtureLineupInput,
} from "../entities/FixtureLineup";
import { LINEUP_STATUS } from "../entities/StatusConstants";
import {
  build_empty_lineup_message,
  build_locked_lineup_message,
  FIXTURE_LINEUP_MESSAGE,
  LINEUP_ACTION,
  type LineupEditAction,
  type LineupStatusTransitionAction,
} from "./FixtureLineupConstants";

export const LINEUP_DECISION = {
  ALLOWED: "allowed",
  REJECTED: "rejected",
} as const;

export type LineupDecision<TAllowed> =
  | { kind: typeof LINEUP_DECISION.ALLOWED; value: TAllowed }
  | { kind: typeof LINEUP_DECISION.REJECTED; reason: string };

function allow<TAllowed>(value: TAllowed): LineupDecision<TAllowed> {
  return { kind: LINEUP_DECISION.ALLOWED, value };
}

function reject<TAllowed>(reason: string): LineupDecision<TAllowed> {
  return { kind: LINEUP_DECISION.REJECTED, reason };
}

function require_players(
  lineup: FixtureLineup,
  action: LineupStatusTransitionAction,
  updates: UpdateFixtureLineupInput,
): LineupDecision<UpdateFixtureLineupInput> {
  return lineup.selected_players.length === 0
    ? reject(build_empty_lineup_message(action))
    : allow(updates);
}

function decide_submit(
  lineup: FixtureLineup,
  submitted_at: FixtureLineup["submitted_at"],
): LineupDecision<UpdateFixtureLineupInput> {
  switch (lineup.status) {
    case LINEUP_STATUS.LOCKED:
      return reject(build_locked_lineup_message(LINEUP_ACTION.SUBMIT));
    case LINEUP_STATUS.SUBMITTED:
      return reject(FIXTURE_LINEUP_MESSAGE.ALREADY_SUBMITTED);
    case LINEUP_STATUS.DRAFT:
      return require_players(lineup, LINEUP_ACTION.SUBMIT, {
        status: LINEUP_STATUS.SUBMITTED,
        submitted_at,
      });
  }
}

function decide_lock(
  lineup: FixtureLineup,
): LineupDecision<UpdateFixtureLineupInput> {
  switch (lineup.status) {
    case LINEUP_STATUS.LOCKED:
      return reject(FIXTURE_LINEUP_MESSAGE.ALREADY_LOCKED);
    case LINEUP_STATUS.DRAFT:
    case LINEUP_STATUS.SUBMITTED:
      return require_players(lineup, LINEUP_ACTION.LOCK, {
        status: LINEUP_STATUS.LOCKED,
      });
  }
}

export function decide_lineup_transition(
  lineup: FixtureLineup,
  action: LineupStatusTransitionAction,
  now: FixtureLineup["submitted_at"],
): LineupDecision<UpdateFixtureLineupInput> {
  switch (action) {
    case LINEUP_ACTION.SUBMIT:
      return decide_submit(lineup, now);
    case LINEUP_ACTION.LOCK:
      return decide_lock(lineup);
  }
}

export function decide_lineup_edit(
  lineup: FixtureLineup,
  action: LineupEditAction,
): LineupDecision<FixtureLineup> {
  switch (lineup.status) {
    case LINEUP_STATUS.LOCKED:
      return reject(build_locked_lineup_message(action));
    case LINEUP_STATUS.DRAFT:
    case LINEUP_STATUS.SUBMITTED:
      return allow(lineup);
  }
}
