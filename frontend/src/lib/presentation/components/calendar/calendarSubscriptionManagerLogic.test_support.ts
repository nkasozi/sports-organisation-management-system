import { expect } from "vitest";

import type { CalendarToken } from "$lib/core/entities/CalendarToken";
import type { Competition } from "$lib/core/entities/Competition";
import type { Team } from "$lib/core/entities/Team";
import {
  parse_calendar_token_value,
  parse_entity_id,
  parse_iso_date_time_string,
  parse_name,
} from "$lib/core/types/DomainScalars";
import type { Result } from "$lib/core/types/Result";

const EXPECTED_SUCCESS_MESSAGE = "Expected a success result";

export function create_paginated_result<TData>(items: TData[]): {
  items: TData[];
  total_count: number;
  page_number: number;
  page_size: number;
  total_pages: number;
} {
  return {
    items,
    total_count: items.length,
    page_number: 1,
    page_size: items.length || 1,
    total_pages: 1,
  };
}

export function get_success_data<TData>(result: Result<TData>): TData {
  if (!result.success) return expect.unreachable(EXPECTED_SUCCESS_MESSAGE);
  return result.data;
}

export function create_team(overrides: Partial<Team> = {}): Team {
  return {
    id: "team_1",
    name: get_success_data(parse_name("Uganda Cranes")),
    ...overrides,
  } as Team;
}

export function create_competition(
  overrides: Partial<Competition> = {},
): Competition {
  return {
    id: "competition_1",
    name: get_success_data(parse_name("Easter Cup")),
    ...overrides,
  } as Competition;
}

export function create_calendar_token(
  overrides: Partial<CalendarToken> = {},
): CalendarToken {
  return {
    id: get_success_data(parse_entity_id("calendar_token_1")),
    created_at: get_success_data(
      parse_iso_date_time_string("2026-04-01T00:00:00.000Z"),
    ),
    updated_at: get_success_data(
      parse_iso_date_time_string("2026-04-01T00:00:00.000Z"),
    ),
    token: get_success_data(parse_calendar_token_value("token_123")),
    user_id: get_success_data(parse_entity_id("user_1")),
    organization_id: get_success_data(parse_entity_id("org_1")),
    feed_type: "team",
    entity_id: get_success_data(parse_entity_id("team_1")),
    entity_name: get_success_data(parse_name("Uganda Cranes")),
    reminder_minutes_before: 30,
    is_active: true,
    last_accessed_at: "",
    access_count: 0,
    expires_at: "2026-07-01T00:00:00.000Z",
    ...overrides,
  } as CalendarToken;
}
