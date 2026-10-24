import type { Fixture } from "$lib/core/entities/Fixture";

import type { LiveGamesStartFlowDependencies } from "./liveGamesStartFlowShared";

export const AUTO_SETUP_DECISION = {
  ALLOWED: "allowed",
  DISABLED: "disabled",
  LOOKUP_FAILED: "lookup_failed",
} as const;

type AutoSetupDecision =
  | { status: typeof AUTO_SETUP_DECISION.ALLOWED }
  | { status: typeof AUTO_SETUP_DECISION.DISABLED }
  | { status: typeof AUTO_SETUP_DECISION.LOOKUP_FAILED; error: string };

const AUTO_SETUP_LOG_SCOPE = "[LiveGames] Auto fixture details setup";
const AUTO_SETUP_LOG_EVENT = {
  ALLOWED: "live_games_auto_setup_allowed",
  DISABLED: "live_games_auto_setup_disabled",
  LOOKUP_FAILED: "live_games_auto_setup_competition_lookup_failed",
} as const;

export async function decide_competition_auto_setup(
  fixture: Fixture,
  competition_use_cases: LiveGamesStartFlowDependencies["competition_use_cases"],
): Promise<AutoSetupDecision> {
  const log_context = {
    fixture_id: fixture.id,
    competition_id: fixture.competition_id,
  };
  const competition_result = await competition_use_cases.get_by_id(
    fixture.competition_id,
  );
  if (!competition_result.success) {
    console.error(AUTO_SETUP_LOG_SCOPE, {
      event: AUTO_SETUP_LOG_EVENT.LOOKUP_FAILED,
      ...log_context,
      error: competition_result.error,
    });
    return {
      status: AUTO_SETUP_DECISION.LOOKUP_FAILED,
      error: competition_result.error,
    };
  }
  const is_allowed =
    competition_result.data.allow_auto_fixture_details_setup === true;
  console.info(AUTO_SETUP_LOG_SCOPE, {
    event: is_allowed
      ? AUTO_SETUP_LOG_EVENT.ALLOWED
      : AUTO_SETUP_LOG_EVENT.DISABLED,
    ...log_context,
  });
  return is_allowed
    ? { status: AUTO_SETUP_DECISION.ALLOWED }
    : { status: AUTO_SETUP_DECISION.DISABLED };
}
