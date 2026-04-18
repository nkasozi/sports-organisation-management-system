import { describe, expect, it, vi } from "vitest";

import type { CalendarToken } from "../entities/CalendarToken";
import {
  build_calendar_token_not_found_error,
  type CalendarTokenRepository,
} from "../interfaces/ports";
import { create_failure_result, create_success_result } from "../types/Result";
import { create_calendar_token_use_cases } from "./CalendarTokenUseCases";

function create_mock_repository(): CalendarTokenRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_by_token: vi.fn(),
    find_by_user: vi.fn(),
    find_by_organization: vi.fn(),
    record_access: vi.fn(),
    deactivate_token: vi.fn(),
  } as CalendarTokenRepository;
}

function create_calendar_token(
  overrides: Partial<CalendarToken> = {},
): CalendarToken {
  return {
    id: "calendar_token_1",
    created_at: "2026-04-01T00:00:00.000Z",
    updated_at: "2026-04-01T00:00:00.000Z",
    token: "token_123",
    user_id: "user_1",
    organization_id: "org_1",
    feed_type: "team",
    entity_id: "team_1",
    entity_name: "Uganda Cranes",
    reminder_minutes_before: 30,
    is_active: true,
    last_accessed_at: "",
    access_count: 0,
    expires_at: "2026-07-01T00:00:00.000Z",
    ...overrides,
  } as CalendarToken;
}

describe("CalendarTokenUseCases", () => {
  it("returns a failure when a feed token is missing", async () => {
    const repository = create_mock_repository();
    const missing_token = "token_123" as CalendarToken["token"];
    const use_cases = create_calendar_token_use_cases({
      calendar_token_repository: repository,
      get_base_url: () => "https://example.com",
    });

    vi.mocked(repository.find_by_token).mockResolvedValue(
      create_failure_result(
        build_calendar_token_not_found_error(missing_token),
      ),
    );

    const result = await use_cases.get_feed_by_token(missing_token);

    expect(result).toEqual(
      create_failure_result(
        build_calendar_token_not_found_error(missing_token),
      ),
    );
  });

  it("updates feed settings when a token exists", async () => {
    const repository = create_mock_repository();
    const token = create_calendar_token();
    const token_value = "token_123" as CalendarToken["token"];
    const updated_token = create_calendar_token({
      reminder_minutes_before: 60,
    });
    const use_cases = create_calendar_token_use_cases({
      calendar_token_repository: repository,
      get_base_url: () => "https://example.com",
    });

    vi.mocked(repository.find_by_token).mockResolvedValue(
      create_success_result(token),
    );
    vi.mocked(repository.update).mockResolvedValue(
      create_success_result(updated_token),
    );

    const result = await use_cases.update_feed_settings(token_value, 60);

    expect(result).toEqual(create_success_result(updated_token));
    expect(repository.update).toHaveBeenCalledWith(token.id, {
      reminder_minutes_before: 60,
    });
  });
});
