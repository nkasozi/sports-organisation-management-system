import type { Fixture, GameEvent } from "../entities/Fixture";
import {
  build_event_correction_record,
  type CorrectionAuthor,
  type CorrectionRequest,
  decide_event_correction,
  EDIT_ALLOWANCE,
  EVENT_CORRECTION_KIND,
  type EventCorrectionKind,
  read_event_edits_used,
  summarize_game_event,
} from "../entities/FixtureEventCorrections";
import { OptionStatus } from "../types/Option";
import {
  create_edited_event_plan,
  create_removed_event_plan,
  find_correctable_event,
  type GameEventCorrection,
} from "./FixtureGameEventCorrections";
import {
  type FixtureUpdatePlan,
  plan_from_updates,
} from "./FixtureGameEventUpdates";
import type { FixturePlanBuilder } from "./FixtureGuardedRunner";
import { FIXTURE_PLAN_DECISION } from "./FixturePeriodTransition";

const EVENT_NOT_FOUND_REASON =
  "This event is no longer in the game. Refresh the page to see the latest events.";
const ALLOWANCE_RESET_REASON =
  "Officials manager gave this game a fresh set of event edits";

interface CorrectionChange {
  plan: FixtureUpdatePlan;
  kind: EventCorrectionKind;
  after: string;
}

function new_correction_id(): string {
  return `corr_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function edits_used_after(fixture: Fixture, author: CorrectionAuthor): number {
  const used = read_event_edits_used(fixture);
  return author.allowance.status === EDIT_ALLOWANCE.LIMITED ? used + 1 : used;
}

function build_correction_plan(
  event_id: string,
  request: CorrectionRequest,
  change_for: (fixture: Fixture, event: GameEvent) => CorrectionChange,
): FixturePlanBuilder {
  return (fixture) => {
    const event = find_correctable_event(fixture, event_id);
    if (event.status === OptionStatus.NONE)
      return {
        kind: FIXTURE_PLAN_DECISION.REJECT,
        reason: EVENT_NOT_FOUND_REASON,
      };
    const decision = decide_event_correction(fixture, request);
    if (!decision.allowed)
      return { kind: FIXTURE_PLAN_DECISION.REJECT, reason: decision.reason };
    const change = change_for(fixture, event.value);
    const record = build_event_correction_record({
      id: new_correction_id(),
      kind: change.kind,
      event_id,
      before: summarize_game_event(event.value),
      after: change.after,
      reason: request.reason,
      author: request.author,
      corrected_at: new Date().toISOString(),
    });
    return {
      kind: FIXTURE_PLAN_DECISION.APPLY,
      plan: plan_from_updates({
        ...change.plan.updates,
        event_edits_used: edits_used_after(fixture, request.author),
        event_corrections: [...(fixture.event_corrections ?? []), record],
      }),
    };
  };
}

export function build_event_edit_plan(
  event_id: string,
  correction: GameEventCorrection,
  request: CorrectionRequest,
): FixturePlanBuilder {
  return build_correction_plan(event_id, request, (fixture, event) => ({
    plan: create_edited_event_plan(fixture, event_id, correction),
    kind: EVENT_CORRECTION_KIND.EDITED,
    after: summarize_game_event({ ...event, ...correction }),
  }));
}

export function build_event_removal_plan(
  event_id: string,
  request: CorrectionRequest,
): FixturePlanBuilder {
  return build_correction_plan(event_id, request, (fixture) => ({
    plan: create_removed_event_plan(fixture, event_id),
    kind: EVENT_CORRECTION_KIND.REMOVED,
    after: "",
  }));
}

export function build_edit_allowance_reset_plan(
  author: Pick<CorrectionAuthor, "name" | "role_label">,
): FixturePlanBuilder {
  return (fixture) => {
    const record = build_event_correction_record({
      id: new_correction_id(),
      kind: EVENT_CORRECTION_KIND.EDITS_RESET,
      event_id: "",
      before: `${read_event_edits_used(fixture)} edits used`,
      after: "0 edits used",
      reason: ALLOWANCE_RESET_REASON,
      author,
      corrected_at: new Date().toISOString(),
    });
    return {
      kind: FIXTURE_PLAN_DECISION.APPLY,
      plan: plan_from_updates({
        event_edits_used: 0,
        event_corrections: [...(fixture.event_corrections ?? []), record],
      }),
    };
  };
}
