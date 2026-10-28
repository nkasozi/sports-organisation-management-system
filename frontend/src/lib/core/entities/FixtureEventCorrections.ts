import { get_event_label } from "./FixtureGameEvents";
import type { Fixture, GameEvent } from "./FixtureTypes";
import { FIXTURE_STATUS } from "./StatusConstants";

export const EVENT_CORRECTION_KIND = {
  EDITED: "edited",
  REMOVED: "removed",
  EDITS_RESET: "edits_reset",
} as const;

export type EventCorrectionKind =
  (typeof EVENT_CORRECTION_KIND)[keyof typeof EVENT_CORRECTION_KIND];

export interface EventCorrectionRecord {
  id: string;
  kind: EventCorrectionKind;
  event_id: string;
  event_before: string;
  event_after: string;
  reason: string;
  corrected_by: string;
  corrected_by_role: string;
  corrected_at: string;
}

export const EDIT_ALLOWANCE = {
  LIMITED: "limited",
  UNLIMITED: "unlimited",
} as const;

export type EditAllowance =
  | { status: typeof EDIT_ALLOWANCE.LIMITED; max_edits: number }
  | { status: typeof EDIT_ALLOWANCE.UNLIMITED };

export interface CorrectionAuthor {
  name: string;
  role_label: string;
  allowance: EditAllowance;
}

export interface CorrectionRequest {
  reason: string;
  author: CorrectionAuthor;
}

type CorrectionDecision =
  | { allowed: true }
  | { allowed: false; reason: string };

const NO_EDITS_USED = 0;
const ASK_MANAGER = "Ask your officials manager";

export function read_event_edits_used(
  fixture: Pick<Fixture, "event_edits_used">,
): number {
  const used = Number(fixture.event_edits_used ?? NO_EDITS_USED);
  return Number.isFinite(used) && used > NO_EDITS_USED ? used : NO_EDITS_USED;
}

function deny(reason: string): CorrectionDecision {
  return { allowed: false, reason };
}

function decide_limited_correction(
  fixture: Pick<Fixture, "status" | "event_edits_used">,
  max_edits: number,
): CorrectionDecision {
  if (fixture.status === FIXTURE_STATUS.COMPLETED)
    return deny(
      `This game has ended, so officials can no longer change its events. ${ASK_MANAGER} if something needs correcting.`,
    );
  if (max_edits <= NO_EDITS_USED)
    return deny(
      `Editing events is turned off for this competition. ${ASK_MANAGER} to make the correction.`,
    );
  if (read_event_edits_used(fixture) >= max_edits)
    return deny(
      `You've used all ${max_edits} event edits for this game. ${ASK_MANAGER} to reset this game's edits.`,
    );
  return { allowed: true };
}

export function decide_event_correction(
  fixture: Pick<Fixture, "status" | "event_edits_used">,
  request: CorrectionRequest,
): CorrectionDecision {
  if (!request.reason.trim())
    return deny(
      "Give a reason for this correction. It is shown in the match log.",
    );
  switch (request.author.allowance.status) {
    case EDIT_ALLOWANCE.UNLIMITED:
      return { allowed: true };
    case EDIT_ALLOWANCE.LIMITED:
      return decide_limited_correction(
        fixture,
        request.author.allowance.max_edits,
      );
  }
}

export function describe_event_edit_allowance(
  fixture: Pick<Fixture, "event_edits_used">,
  allowance: EditAllowance,
): string {
  if (allowance.status === EDIT_ALLOWANCE.UNLIMITED) return "";
  const left = Math.max(
    NO_EDITS_USED,
    allowance.max_edits - read_event_edits_used(fixture),
  );
  return left === NO_EDITS_USED
    ? "No event edits left for this game"
    : `${left} of ${allowance.max_edits} event edits left for this game`;
}

export function summarize_game_event(
  event: Pick<
    GameEvent,
    "event_type" | "minute" | "player_name" | "secondary_player_name"
  >,
): string {
  const players = event.secondary_player_name
    ? `${event.player_name} → ${event.secondary_player_name}`
    : event.player_name;
  return `${get_event_label(event.event_type)} ${event.minute}' ${players}`.trim();
}

export function build_event_correction_record(input: {
  id: string;
  kind: EventCorrectionKind;
  event_id: string;
  before: string;
  after: string;
  reason: string;
  author: Pick<CorrectionAuthor, "name" | "role_label">;
  corrected_at: string;
}): EventCorrectionRecord {
  return {
    id: input.id,
    kind: input.kind,
    event_id: input.event_id,
    event_before: input.before,
    event_after: input.after,
    reason: input.reason.trim(),
    corrected_by: input.author.name,
    corrected_by_role: input.author.role_label,
    corrected_at: input.corrected_at,
  };
}
