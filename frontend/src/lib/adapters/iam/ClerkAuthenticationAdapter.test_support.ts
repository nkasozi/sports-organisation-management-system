import { expect, vi } from "vitest";

import { create_auth_token_payload_core } from "$lib/core/interfaces/ports";
import { create_success_result } from "$lib/core/types/Result";

import { type ClerkSessionProvider } from "./ClerkAuthenticationAdapter";
type AuthTokenPayload =
  ReturnType<typeof create_auth_token_payload_core> extends infer T
    ? T extends { success: true; data: infer TData }
      ? TData
      : never
    : never;

export function create_auth_token_input(
  overrides: {
    display_name?: string;
    email?: string;
    organization_id?: string;
    role?:
      | "super_admin"
      | "org_admin"
      | "officials_manager"
      | "team_manager"
      | "official"
      | "player"
      | "public_viewer";
    team_id?: string;
    user_id?: string;
  } = {},
): AuthTokenPayload {
  const result = create_auth_token_payload_core({
    user_id: overrides.user_id ?? "clerk-user-123",
    email: overrides.email ?? "testuser@example.com",
    display_name: overrides.display_name ?? "Test User",
    role: overrides.role ?? "team_manager",
    organization_id: overrides.organization_id ?? "org-1",
    team_id: overrides.team_id ?? "team-1",
  });

  expect(result.success).toBe(true);

  return (
    result as {
      success: true;
      data: AuthTokenPayload;
    }
  ).data;
}

export function create_mock_clerk_session_provider(
  overrides?: Partial<ClerkSessionProvider>,
): ClerkSessionProvider {
  return {
    get_session_token: vi
      .fn()
      .mockResolvedValue(create_success_result("mock-clerk-jwt-token-abc123")),
    get_current_user: vi.fn().mockReturnValue(
      create_success_result({
        id: "clerk-user-123",
        email_address: "testuser@example.com",
        full_name: "Test User",
        first_name: "Test",
        last_name: "User",
        image_url: "https://img.clerk.com/avatar.png",
      }),
    ),
    is_signed_in: vi.fn().mockReturnValue(true),
    ...overrides,
  } as ClerkSessionProvider;
}
