import { vi } from "vitest";

import type {
  AuthenticationPort,
  SystemUserRepository,
  UserRole,
} from "$lib/core/interfaces/ports";

export function create_mock_auth_port(
  email: string,
  is_valid: boolean = true,
  error_message?: string,
): AuthenticationPort {
  const verification_payload = is_valid
    ? {
        payload: {
          user_id: "test-user-123",
          email,
          display_name: "Test User",
          organization_id: "org-1",
          team_id: "team-1",
          issued_at: Date.now(),
          expires_at: Date.now() + 365 * 24 * 60 * 60 * 1000,
        },
      }
    : {};

  return {
    generate_token: vi.fn(),
    verify_token: vi.fn().mockResolvedValue({
      success: true,
      data: {
        is_valid,
        ...verification_payload,
        error_message,
      },
    }),
  } as unknown as AuthenticationPort;
}

function create_system_user_lookup_result(
  role: UserRole,
  email: string,
): Record<string, unknown> {
  return {
    success: true,
    data: {
      items: [
        {
          id: `test-${role}-123`,
          email,
          first_name: "Test",
          last_name: role,
          role,
          status: "active",
          organization_id: "org-1",
          team_id: "team-1",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      total: 1,
      page: 1,
      page_size: 10,
      has_next_page: false,
    },
  };
}

export function create_mock_system_user_repository(
  role: UserRole,
  email: string = `${role}@test.com`,
): SystemUserRepository {
  return {
    find_by_email: vi
      .fn()
      .mockResolvedValue(create_system_user_lookup_result(role, email)),
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    find_by_role: vi.fn(),
    find_active_users: vi.fn(),
    find_admins: vi.fn(),
    find_with_filter: vi.fn(),
  } as unknown as SystemUserRepository;
}
