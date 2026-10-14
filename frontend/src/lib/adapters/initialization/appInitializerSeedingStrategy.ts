import {
  SEEDING_COMPLETION_STATE,
  SEEDING_STRATEGY,
  type SeedingCompletionState,
} from "./initializationConstants";
import type { SeedingStrategy } from "./seedingService";

const PUBLIC_CONTENT_PATH_PREFIXES = [
  "/competition-results",
  "/calendar",
  "/match-report",
] as const;

export function get_is_public_content_page(path: string): boolean {
  return PUBLIC_CONTENT_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function can_skip_seeding_for_public_visitor(
  current_path: string,
  completion_state: SeedingCompletionState,
): boolean {
  switch (completion_state) {
    case SEEDING_COMPLETION_STATE.COMPLETE:
      return get_is_public_content_page(current_path);
    case SEEDING_COMPLETION_STATE.NOT_COMPLETE:
    case SEEDING_COMPLETION_STATE.UNREADABLE:
      return false;
  }
}

export function determine_seeding_strategy(
  user_is_signed_in: boolean,
  current_path: string,
  completion_state: SeedingCompletionState,
  session_already_synced: boolean,
): SeedingStrategy {
  if (user_is_signed_in) return SEEDING_STRATEGY.SKIP_SEEDING;
  return can_skip_seeding_for_public_visitor(current_path, completion_state)
    ? SEEDING_STRATEGY.SKIP_SEEDING
    : SEEDING_STRATEGY.LOCAL_ONLY;
}
