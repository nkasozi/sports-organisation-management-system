import type { Competition } from "$lib/core/entities/Competition";
import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
import type { Sport, SubstitutionRule } from "$lib/core/entities/Sport";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "$lib/core/types/Option";
import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

import type { PlayerAvailability } from "./liveGamePlayerAvailability";

export const SUBSTITUTION_LIMIT = {
  UNLIMITED: "unlimited",
  LIMITED: "limited",
} as const;

export type SubstitutionLimit =
  | { kind: typeof SUBSTITUTION_LIMIT.UNLIMITED }
  | { kind: typeof SUBSTITUTION_LIMIT.LIMITED; max_substitutions: number };

export type EffectiveSubstitutionRules = {
  limit: SubstitutionLimit;
  return_after_substitution_allowed: boolean;
};

type SubstitutionCheck = {
  on_field_players: LineupPlayer[];
  player_on_id: string;
  player_off_id: string;
  max_players_on_field: number;
  availability: PlayerAvailability;
  rules: EffectiveSubstitutionRules;
};

const UNLIMITED_SUBSTITUTIONS_VALUE = -1;

export const OPEN_SUBSTITUTION_RULES: EffectiveSubstitutionRules = {
  limit: { kind: SUBSTITUTION_LIMIT.UNLIMITED },
  return_after_substitution_allowed: true,
};

export const SUBSTITUTION_MESSAGE = {
  PLAYER_ON_REQUIRED: "Choose the player coming on.",
  PLAYER_ON_DISMISSED:
    "This player has been sent off and can't return to the game.",
  PLAYER_ON_ALREADY_PLAYING:
    "The player coming on is already on the field. Choose a substitute instead.",
  PLAYER_OFF_NOT_PLAYING:
    "The player coming off is not on the field. Choose a player who is currently playing.",
  FIELD_FULL:
    "The team already has the maximum number of players on the field. Choose the player coming off.",
  LIMIT_REACHED:
    "This team has used all the substitutions allowed for this game.",
  NO_RETURN:
    "Players who were substituted off can't come back on under this competition's rules.",
} as const;

function to_limit(max_substitutions: number): SubstitutionLimit {
  return max_substitutions === UNLIMITED_SUBSTITUTIONS_VALUE
    ? { kind: SUBSTITUTION_LIMIT.UNLIMITED }
    : { kind: SUBSTITUTION_LIMIT.LIMITED, max_substitutions };
}

export function resolve_substitution_rules(
  sport: Sport | undefined,
  competition: Competition | undefined,
): EffectiveSubstitutionRules {
  const merged: Partial<SubstitutionRule> = {
    ...(sport?.substitution_rules ?? {}),
    ...(competition?.rule_overrides?.substitution_rules ?? {}),
  };
  return {
    limit:
      merged.max_substitutions_per_game === void 0
        ? OPEN_SUBSTITUTION_RULES.limit
        : to_limit(merged.max_substitutions_per_game),
    return_after_substitution_allowed:
      merged.return_after_substitution_allowed ??
      OPEN_SUBSTITUTION_RULES.return_after_substitution_allowed,
  };
}

function is_limit_reached(check: SubstitutionCheck): boolean {
  switch (check.rules.limit.kind) {
    case SUBSTITUTION_LIMIT.UNLIMITED:
      return false;
    case SUBSTITUTION_LIMIT.LIMITED:
      return (
        check.availability.substitutions_used >=
        check.rules.limit.max_substitutions
      );
  }
}

const NO_VIOLATION: Option<string> = create_none_option();

function find_rule_violation(check: SubstitutionCheck): Option<string> {
  if (check.availability.suspended_ids.has(check.player_on_id))
    return NO_VIOLATION;
  if (is_limit_reached(check))
    return create_some_option(SUBSTITUTION_MESSAGE.LIMIT_REACHED);
  const is_returning = check.availability.substituted_off_ids.has(
    check.player_on_id,
  );
  return is_returning && !check.rules.return_after_substitution_allowed
    ? create_some_option(SUBSTITUTION_MESSAGE.NO_RETURN)
    : NO_VIOLATION;
}

function is_on_field(players: LineupPlayer[], player_id: string): boolean {
  return players.some((player) => player.id === player_id);
}

function find_field_violation(check: SubstitutionCheck): Option<string> {
  if (is_on_field(check.on_field_players, check.player_on_id))
    return create_some_option(SUBSTITUTION_MESSAGE.PLAYER_ON_ALREADY_PLAYING);
  if (
    check.player_off_id &&
    !is_on_field(check.on_field_players, check.player_off_id)
  )
    return create_some_option(SUBSTITUTION_MESSAGE.PLAYER_OFF_NOT_PLAYING);
  return !check.player_off_id &&
    check.on_field_players.length >= check.max_players_on_field
    ? create_some_option(SUBSTITUTION_MESSAGE.FIELD_FULL)
    : NO_VIOLATION;
}

export function validate_substitution(
  check: SubstitutionCheck,
): Result<boolean, string> {
  if (!check.player_on_id)
    return create_failure_result(SUBSTITUTION_MESSAGE.PLAYER_ON_REQUIRED);
  if (check.availability.ejected_ids.has(check.player_on_id))
    return create_failure_result(SUBSTITUTION_MESSAGE.PLAYER_ON_DISMISSED);
  const field_violation = find_field_violation(check);
  if (field_violation.status === OptionStatus.SOME)
    return create_failure_result(field_violation.value);
  const rule_violation = find_rule_violation(check);
  return rule_violation.status === OptionStatus.SOME
    ? create_failure_result(rule_violation.value)
    : create_success_result(true);
}
