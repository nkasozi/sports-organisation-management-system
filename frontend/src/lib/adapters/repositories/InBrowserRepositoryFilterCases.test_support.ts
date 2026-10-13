import type { QueryOptions } from "../../core/interfaces/ports";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import { get_activity_repository } from "./InBrowserActivityRepository";
import { get_calendar_token_repository } from "./InBrowserCalendarTokenRepository";
import { InBrowserCompetitionFormatRepository } from "./InBrowserCompetitionFormatRepository";
import type { FakeRow } from "./InBrowserRepositoryFakeDatabase.test_support";

export interface FilterableRepository {
  find_all(
    filter: Record<string, unknown>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<{ id: string }>;
}

export interface RepositoryFilterCase {
  name: string;
  table: string;
  create: () => FilterableRepository;
  rows: FakeRow[];
  filter: Record<string, unknown>;
  expected_ids: string[];
}

export function as_filterable(repository: unknown): FilterableRepository {
  return repository as FilterableRepository;
}

export function ids_of(result: { success: boolean; data?: unknown }): string[] {
  const data = result.data as { id: string }[] | { items: { id: string }[] };
  const items = Array.isArray(data) ? data : data.items;
  return items.map((item) => item.id);
}

export function row(id: string, fields: Record<string, unknown>): FakeRow {
  return { id, created_at: "", updated_at: "", ...fields };
}

export function create_case_builder(
  label: string,
  table: string,
  create: () => FilterableRepository,
  rows: FakeRow[],
): (
  filter: Record<string, unknown>,
  expected_ids: string[],
) => RepositoryFilterCase {
  return (filter, expected_ids) => ({
    name: `${label} ${JSON.stringify(filter)}`,
    table,
    create,
    rows,
    filter,
    expected_ids,
  });
}

const ACTIVITY_ROWS: FakeRow[] = [
  row("a1", {
    title: "Morning Training",
    organization_id: "o1",
    category_id: "c1",
    category_type: "training",
    team_ids: ["t1", "t2"],
    competition_id: "comp1",
    fixture_id: "f1",
    status: "scheduled",
    source_type: "manual",
    start_datetime: "2024-03-10T08:00:00.000Z",
    is_all_day: false,
  }),
  row("a2", {
    title: "Evening Match",
    organization_id: "o2",
    category_id: "c2",
    category_type: "match",
    team_ids: ["t3"],
    competition_id: "comp2",
    fixture_id: "f2",
    status: "cancelled",
    source_type: "fixture",
    start_datetime: "2024-05-10T18:00:00.000Z",
    is_all_day: true,
  }),
];

const activity_case = create_case_builder(
  "activity",
  "activities",
  () => as_filterable(get_activity_repository()),
  ACTIVITY_ROWS,
);

export const ACTIVITY_FILTER_CASES: RepositoryFilterCase[] = [
  activity_case({ title_contains: "MORNING" }, ["a1"]),
  activity_case({ organization_id: "o2" }, ["a2"]),
  activity_case({ category_id: "c1" }, ["a1"]),
  activity_case({ category_type: "match" }, ["a2"]),
  activity_case({ team_id: "t2" }, ["a1"]),
  activity_case({ competition_id: "comp2" }, ["a2"]),
  activity_case({ fixture_id: "f1" }, ["a1"]),
  activity_case({ status: "cancelled" }, ["a2"]),
  activity_case({ source_type: "manual" }, ["a1"]),
  activity_case({ start_date_after: "2024-04-01T00:00:00.000Z" }, ["a2"]),
  activity_case({ start_date_before: "2024-04-01T00:00:00.000Z" }, ["a1"]),
  activity_case({ is_all_day: false }, ["a1"]),
  activity_case({ is_all_day: true }, ["a2"]),
  activity_case({ organization_id: "" }, ["a1", "a2"]),
];

const TOKEN_ROWS: FakeRow[] = [
  row("k1", {
    user_id: "u1",
    organization_id: "o1",
    feed_type: "team",
    entity_id: "e1",
    is_active: true,
  }),
  row("k2", {
    user_id: "u2",
    organization_id: "o2",
    feed_type: "competition",
    entity_id: "e2",
    is_active: false,
  }),
];

const token_case = create_case_builder(
  "calendar token",
  "calendar_tokens",
  () => as_filterable(get_calendar_token_repository()),
  TOKEN_ROWS,
);

export const CALENDAR_TOKEN_FILTER_CASES: RepositoryFilterCase[] = [
  token_case({ user_id: "u1" }, ["k1"]),
  token_case({ organization_id: "o2" }, ["k2"]),
  token_case({ feed_type: "competition" }, ["k2"]),
  token_case({ entity_id: "e1" }, ["k1"]),
  token_case({ is_active: false }, ["k2"]),
];

const FORMAT_ROWS: FakeRow[] = [
  row("cf1", {
    name: "League Format",
    code: "LEAGUE",
    format_type: "league",
    status: "active",
    organization_id: "o1",
  }),
  row("cf2", {
    name: "Cup Format",
    code: "CUP",
    format_type: "knockout",
    status: "inactive",
    organization_id: "o2",
  }),
];

const format_case = create_case_builder(
  "competition format",
  "competition_formats",
  () => as_filterable(new InBrowserCompetitionFormatRepository()),
  FORMAT_ROWS,
);

export const COMPETITION_FORMAT_FILTER_CASES: RepositoryFilterCase[] = [
  format_case({ name_contains: "league" }, ["cf1"]),
  format_case({ code: "CUP" }, ["cf2"]),
  format_case({ format_type: "league" }, ["cf1"]),
  format_case({ status: "inactive" }, ["cf2"]),
  format_case({ organization_id: "o1" }, ["cf1"]),
];
