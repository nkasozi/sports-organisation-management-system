import type { Fixture } from "../../core/entities/Fixture";
import type { FixtureFilter } from "../../core/interfaces/ports";

export function apply_fixture_entity_filter(
  entities: Fixture[],
  filter: FixtureFilter,
): Fixture[] {
  let filtered = entities;
  if (filter.organization_id) {
    filtered = filtered.filter(
      (fixture: Fixture) => fixture.organization_id === filter.organization_id,
    );
  }
  if (filter.competition_id) {
    filtered = filtered.filter(
      (fixture: Fixture) => fixture.competition_id === filter.competition_id,
    );
  }
  if (filter.stage_id) {
    filtered = filtered.filter(
      (fixture: Fixture) => fixture.stage_id === filter.stage_id,
    );
  }
  if (filter.home_team_id) {
    filtered = filtered.filter(
      (fixture: Fixture) => fixture.home_team_id === filter.home_team_id,
    );
  }
  if (filter.away_team_id) {
    filtered = filtered.filter(
      (fixture: Fixture) => fixture.away_team_id === filter.away_team_id,
    );
  }
  if (filter.team_id) {
    filtered = filtered.filter(
      (fixture: Fixture) =>
        fixture.home_team_id === filter.team_id ||
        fixture.away_team_id === filter.team_id,
    );
  }
  if ("round_number" in filter) {
    filtered = filtered.filter(
      (fixture: Fixture) => fixture.round_number === filter.round_number,
    );
  }
  if ("match_day" in filter) {
    filtered = filtered.filter(
      (fixture: Fixture) => fixture.match_day === filter.match_day,
    );
  }
  if (filter.status) {
    filtered = filtered.filter(
      (fixture: Fixture) => fixture.status === filter.status,
    );
  }
  if (filter.scheduled_date_from) {
    const scheduled_date_from = filter.scheduled_date_from;
    filtered = filtered.filter(
      (fixture: Fixture) => fixture.scheduled_date >= scheduled_date_from,
    );
  }
  if (filter.scheduled_date_to) {
    const scheduled_date_to = filter.scheduled_date_to;
    filtered = filtered.filter(
      (fixture: Fixture) => fixture.scheduled_date <= scheduled_date_to,
    );
  }
  return filtered;
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
