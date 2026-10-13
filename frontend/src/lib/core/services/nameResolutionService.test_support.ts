import { expect, vi } from "vitest";

import type { BaseEntity } from "$lib/core/entities/BaseEntity";

import {
  type NameResolutionResult,
  type NameSearchUseCases,
} from "./nameResolutionService";

export function create_mock_use_cases(list_response: {
  success: boolean;
  data?: BaseEntity[];
  error_message?: string;
}): NameSearchUseCases {
  const items = list_response.data ?? [];
  return {
    list: vi.fn().mockResolvedValue(
      list_response.success
        ? {
            success: true,
            data: {
              items,
              total_count: items.length,
              page_number: 1,
              page_size: items.length,
              total_pages: 1,
            },
          }
        : { success: false, error: list_response.error_message ?? "" },
    ),
  };
}

export function create_mock_entity(id: string, name: string): BaseEntity {
  return {
    id,
    name,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  } as unknown as BaseEntity;
}

export function expect_successful_resolution(
  result: NameResolutionResult,
  expected_resolved_id: string,
): void {
  expect(result.success).toBe(true);
  expect(result).not.toHaveProperty("error_message");

  if (!result.success) {
    expect(result.success).toBe(true);
    return;
  }

  expect(result.resolved_id).toBe(expected_resolved_id);
}

export function expect_failed_resolution(result: NameResolutionResult): string {
  expect(result.success).toBe(false);
  expect(result).not.toHaveProperty("resolved_id");

  if (result.success) {
    expect(result.success).toBe(false);
    return "";
  }

  return result.error_message;
}
