import type { FixtureLineup } from "../entities/FixtureLineup";
import { LINEUP_STATUS } from "../entities/StatusConstants";
import type { PreFlightCheck } from "./fixtureStartChecks";
import {
  CHECK_STATUS,
  FIXTURE_START_CHECK_NAME,
  FIXTURE_START_CHECKS_MESSAGES,
} from "./FixtureStartChecksConstants";

interface LineupCheckTarget {
  check_name: string;
  team_label: string;
  team_id: string;
}

const SUBMITTED_LINEUP_STATUSES: ReadonlySet<string> = new Set([
  LINEUP_STATUS.SUBMITTED,
  LINEUP_STATUS.LOCKED,
]);

export function build_officials_check(officials_count: number): PreFlightCheck {
  const messages = FIXTURE_START_CHECKS_MESSAGES;
  const has_officials = officials_count > 0;
  return {
    check_name: FIXTURE_START_CHECK_NAME.OFFICIALS,
    status: has_officials ? CHECK_STATUS.PASSED : CHECK_STATUS.FAILED,
    message: has_officials
      ? messages.officials_assigned(officials_count)
      : messages.NO_OFFICIALS,
    fix_suggestion: has_officials ? "" : messages.NO_OFFICIALS_FIX,
  };
}

export function build_lineup_check(
  lineups: FixtureLineup[],
  target: LineupCheckTarget,
): PreFlightCheck {
  const messages = FIXTURE_START_CHECKS_MESSAGES;
  const lineup = lineups.find((l) => l.team_id === target.team_id);
  if (lineup && SUBMITTED_LINEUP_STATUSES.has(lineup.status)) {
    return {
      check_name: target.check_name,
      status: CHECK_STATUS.PASSED,
      message: messages.lineup_submitted(
        target.team_label,
        lineup.selected_players.length,
      ),
      fix_suggestion: "",
    };
  }
  return {
    check_name: target.check_name,
    status: CHECK_STATUS.FAILED,
    message: lineup
      ? messages.lineup_not_submitted(target.team_label, lineup.status)
      : messages.lineup_missing(target.team_label),
    fix_suggestion: messages.LINEUP_NOT_SUBMITTED_FIX,
  };
}
