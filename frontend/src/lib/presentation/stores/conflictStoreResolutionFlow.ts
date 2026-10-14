import type { ScalarInput } from "$lib/core/types/DomainScalars";
import type {
  ConflictRecord,
  ConflictResolutionAction,
} from "$lib/infrastructure/sync/conflictTypes";

import {
  type ConflictResolutionFeedback,
  ConflictResolutionFeedbackStatus,
} from "./syncStoreConflictOutcome";

export const ResolutionNoticeStatus = {
  HIDDEN: "hidden",
  SHOWN: "shown",
} as const;

export type ResolutionNotice =
  | { status: typeof ResolutionNoticeStatus.HIDDEN }
  | { status: typeof ResolutionNoticeStatus.SHOWN; message: string };

export const HIDDEN_RESOLUTION_NOTICE: ResolutionNotice = {
  status: ResolutionNoticeStatus.HIDDEN,
};

type ResolveConflict = (
  conflict: ScalarInput<ConflictRecord>,
  action: ConflictResolutionAction,
) => Promise<ConflictResolutionFeedback>;

const RESOLVED_FEEDBACK: ConflictResolutionFeedback = {
  status: ConflictResolutionFeedbackStatus.RESOLVED,
};

export async function resolve_conflicts_in_order(
  resolve: ResolveConflict,
  conflicts: readonly ScalarInput<ConflictRecord>[],
  action: ConflictResolutionAction,
): Promise<ConflictResolutionFeedback> {
  for (const conflict of conflicts) {
    const feedback = await resolve(conflict, action);
    if (is_attention_needed(feedback)) return feedback;
  }
  return RESOLVED_FEEDBACK;
}

export function build_resolution_notice(
  feedback: ConflictResolutionFeedback,
): ResolutionNotice {
  switch (feedback.status) {
    case ConflictResolutionFeedbackStatus.NEEDS_ATTENTION:
      return {
        status: ResolutionNoticeStatus.SHOWN,
        message: feedback.message,
      };
    case ConflictResolutionFeedbackStatus.RESOLVED:
    case ConflictResolutionFeedbackStatus.MOVED_TO_REVIEW:
      return HIDDEN_RESOLUTION_NOTICE;
  }
}

export function is_attention_needed(
  feedback: ConflictResolutionFeedback,
): boolean {
  return feedback.status === ConflictResolutionFeedbackStatus.NEEDS_ATTENTION;
}
