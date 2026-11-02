import type { Fixture } from "$lib/core/entities/Fixture";
import { build_fixture_kickoff_date_time } from "$lib/core/entities/FixtureKickoff";

const SEARCH_TERM_SEPARATOR = /\s+/;
const SEARCH_TEXT_JOINER = " ";

interface CompletedResultsSearchCommand {
  fixtures: Fixture[];
  search_query: string;
  get_team_name: (team_id: string) => string;
  get_stage_name: (stage_id: string) => string;
  get_stage_type: (stage_id: string) => string;
  format_date: (date_string: string) => string;
}

interface CompletedResultsPageCommand {
  fixtures: Fixture[];
  page_number: number;
  items_per_page: number;
}

interface CompletedResultsPage {
  page_fixtures: Fixture[];
  total_pages: number;
}

function split_search_terms(search_query: string): string[] {
  return search_query
    .trim()
    .toLowerCase()
    .split(SEARCH_TERM_SEPARATOR)
    .filter((search_term: string) => search_term.length > 0);
}

function build_fixture_search_text(
  fixture: Fixture,
  command: CompletedResultsSearchCommand,
): string {
  return [
    command.get_team_name(fixture.home_team_id),
    command.get_team_name(fixture.away_team_id),
    command.get_stage_name(fixture.stage_id),
    command.get_stage_type(fixture.stage_id),
    command.format_date(build_fixture_kickoff_date_time(fixture)),
    fixture.scheduled_date,
  ]
    .join(SEARCH_TEXT_JOINER)
    .toLowerCase();
}

export function filter_completed_results(
  command: CompletedResultsSearchCommand,
): Fixture[] {
  const search_terms = split_search_terms(command.search_query);
  if (search_terms.length === 0) return command.fixtures;
  return command.fixtures.filter((fixture: Fixture) => {
    const search_text = build_fixture_search_text(fixture, command);
    return search_terms.every((search_term: string) =>
      search_text.includes(search_term),
    );
  });
}

export function build_completed_results_page(
  command: CompletedResultsPageCommand,
): CompletedResultsPage {
  const start_index = (command.page_number - 1) * command.items_per_page;
  return {
    page_fixtures: command.fixtures.slice(
      start_index,
      start_index + command.items_per_page,
    ),
    total_pages: Math.max(
      1,
      Math.ceil(command.fixtures.length / command.items_per_page),
    ),
  };
}
