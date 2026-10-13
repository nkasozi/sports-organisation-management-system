import type { Fixture } from "../../core/entities/Fixture";
import type { FixtureFilter } from "../../core/interfaces/ports";
import {
  apply_entity_filter_rules,
  type EntityFilterRule,
  equals_rule,
  FILTER_RULE_ACTIVATION,
  predicate_rule,
} from "./InBrowserRepositoryFilterRules";

const FIXTURE_FILTER_RULES: EntityFilterRule<Fixture, FixtureFilter>[] = [
  equals_rule("organization_id"),
  equals_rule("competition_id"),
  equals_rule("stage_id"),
  equals_rule("home_team_id"),
  equals_rule("away_team_id"),
  predicate_rule(
    "team_id",
    (fixture, filter) =>
      fixture.home_team_id === filter.team_id ||
      fixture.away_team_id === filter.team_id,
  ),
  equals_rule("round_number", FILTER_RULE_ACTIVATION.WHEN_KEY_PRESENT),
  equals_rule("match_day", FILTER_RULE_ACTIVATION.WHEN_KEY_PRESENT),
  equals_rule("status"),
  predicate_rule(
    "scheduled_date_from",
    (fixture, filter) =>
      fixture.scheduled_date >= String(filter.scheduled_date_from),
  ),
  predicate_rule(
    "scheduled_date_to",
    (fixture, filter) =>
      fixture.scheduled_date <= String(filter.scheduled_date_to),
  ),
];

export function apply_fixture_entity_filter(
  entities: Fixture[],
  filter: FixtureFilter,
): Fixture[] {
  return apply_entity_filter_rules(entities, filter, FIXTURE_FILTER_RULES);
}

export function sort_fixtures_by_schedule(entities: Fixture[]): Fixture[] {
  return [...entities].sort(
    (first_fixture: Fixture, second_fixture: Fixture) => {
      const date_comparison = first_fixture.scheduled_date.localeCompare(
        second_fixture.scheduled_date,
      );
      return date_comparison !== 0
        ? date_comparison
        : first_fixture.scheduled_time.localeCompare(
            second_fixture.scheduled_time,
          );
    },
  );
}
