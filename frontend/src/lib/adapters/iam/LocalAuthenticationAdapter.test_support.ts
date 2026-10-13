import { expect, vi } from "vitest";

import type { InBrowserSystemUserRepository } from "$lib/adapters/repositories/InBrowserSystemUserRepository";
import type { SystemUser } from "$lib/core/entities/SystemUser";
import {
  type AuthTokenPayload,
  create_auth_token_payload_core,
} from "$lib/core/interfaces/ports";

interface CreateTestPayloadOverrides {
  user_id?: string;
  email?: string;
  display_name?: string;
  role?: AuthTokenPayload["role"];
  organization_id?: string;
  team_id?: string;
}

export function create_test_payload(): Omit<
  AuthTokenPayload,
  "issued_at" | "expires_at"
> {
  return create_test_payload_with_overrides();
}

export function create_test_payload_with_overrides(
  overrides: CreateTestPayloadOverrides = {},
): Omit<AuthTokenPayload, "issued_at" | "expires_at"> {
  const result = create_auth_token_payload_core({
    user_id: overrides.user_id ?? "test-user-123",
    email: overrides.email ?? "test@example.com",
    display_name: overrides.display_name ?? "Test User",
    role: overrides.role ?? "super_admin",
    organization_id: overrides.organization_id ?? "*",
    team_id: overrides.team_id ?? "*",
  });

  expect(result.success).toBe(true);

  return (
    result as {
      success: true;
      data: Omit<AuthTokenPayload, "issued_at" | "expires_at">;
    }
  ).data;
}

function create_mock_system_user(): SystemUser {
  return {
    id: "test-user-123",
    email: "test@example.com",
    first_name: "Test",
    last_name: "User",
    role: "super_admin",
    status: "active",
    organization_id: "*",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as SystemUser;
}

export function create_mock_repository(): InBrowserSystemUserRepository {
  const mock_user = create_mock_system_user();
  return {
    find_by_email: vi.fn().mockResolvedValue({
      success: true,
      data: {
        items: [mock_user],
        total_count: 1,
        page_number: 1,
        page_size: 10,
        total_pages: 1,
      },
    }),
  } as unknown as InBrowserSystemUserRepository;
}
