import type {
  FixtureLineup,
  LineupPlayer,
  UpdateFixtureLineupInput,
} from "../entities/FixtureLineup";
import {
  FIXTURE_STATUS,
  type FixtureStatusValue,
  LINEUP_STATUS,
} from "../entities/StatusConstants";
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

function decide_lineup_status_edit(
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

export function decide_lineup_edit(
  lineup: FixtureLineup,
  action: LineupEditAction,
  fixture_status: FixtureStatusValue,
): LineupDecision<FixtureLineup> {
  switch (fixture_status) {
    case FIXTURE_STATUS.SCHEDULED:
      return decide_lineup_status_edit(lineup, action);
    case FIXTURE_STATUS.IN_PROGRESS:
    case FIXTURE_STATUS.COMPLETED:
    case FIXTURE_STATUS.POSTPONED:
    case FIXTURE_STATUS.CANCELLED:
    default:
      return reject(FIXTURE_LINEUP_MESSAGE.GAME_ALREADY_STARTED);
  }
}

type ComparablePlayer = Omit<LineupPlayer, "time_on" | "time_off">;

function to_comparable_player(player: LineupPlayer): string {
  const { time_on: _time_on, time_off: _time_off, ...rest } = player;
  const comparable: ComparablePlayer = rest;
  return JSON.stringify(
    Object.keys(comparable)
      .sort()
      .map((key) => [key, comparable[key as keyof ComparablePlayer]]),
  );
}

function only_player_times_changed(
  lineup: FixtureLineup,
  selected_players: LineupPlayer[],
): boolean {
  const stored = lineup.selected_players.map(to_comparable_player).sort();
  const submitted = selected_players.map(to_comparable_player).sort();
  return (
    stored.length === submitted.length &&
    stored.every((player, index) => player === submitted[index])
  );
}

export function decide_live_player_times(
  lineup: FixtureLineup,
  fixture_status: FixtureStatusValue,
  selected_players: LineupPlayer[],
): LineupDecision<UpdateFixtureLineupInput> {
  switch (fixture_status) {
    case FIXTURE_STATUS.SCHEDULED:
    case FIXTURE_STATUS.IN_PROGRESS:
      return only_player_times_changed(lineup, selected_players)
        ? allow({ selected_players })
        : reject(FIXTURE_LINEUP_MESSAGE.LIVE_TIMES_ONLY);
    case FIXTURE_STATUS.COMPLETED:
    case FIXTURE_STATUS.POSTPONED:
    case FIXTURE_STATUS.CANCELLED:
    default:
      return reject(FIXTURE_LINEUP_MESSAGE.LIVE_TIMES_NOT_ALLOWED);
  }
}
