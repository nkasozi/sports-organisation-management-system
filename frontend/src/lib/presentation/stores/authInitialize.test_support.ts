import { type Mock, vi } from "vitest";

interface AuthInitializeMocks {
  set_signed_in: (next_value: boolean) => void;
  is_signed_in: {
    subscribe(subscriber: (value: boolean) => void): () => void;
  };
  sync_branding_with_profile: Mock;
  generate_token_for_profile: Mock;
  load_saved_token: Mock;
  load_sidebar_menu_for_role: Mock;
  save_profile_id: Mock;
  save_token: Mock;
  sync_user_context_with_event_bus: Mock;
  create_default_anonymous_state: Mock;
  get_clerk_email: Mock;
  load_available_profiles: Mock;
  try_restore_anonymous_session: Mock;
  try_restore_signed_in_session: Mock;
  wait_for_clerk: Mock;
}

export function create_auth_initialize_mocks(): AuthInitializeMocks {
  let signed_in_value = false;
  const subscribers = new Set<(value: boolean) => void>();

  return {
    set_signed_in: (next_value: boolean): void => {
      signed_in_value = next_value;
      subscribers.forEach((subscriber) => subscriber(signed_in_value));
    },
    is_signed_in: {
      subscribe(subscriber: (value: boolean) => void): () => void {
        subscriber(signed_in_value);
        subscribers.add(subscriber);
        return (): void => {
          subscribers.delete(subscriber);
        };
      },
    },
    sync_branding_with_profile: vi.fn(),
    generate_token_for_profile: vi.fn(),
    load_saved_token: vi.fn(),
    load_sidebar_menu_for_role: vi.fn(),
    save_profile_id: vi.fn(),
    save_token: vi.fn(),
    sync_user_context_with_event_bus: vi.fn(),
    create_default_anonymous_state: vi.fn(),
    get_clerk_email: vi.fn(),
    load_available_profiles: vi.fn(),
    try_restore_anonymous_session: vi.fn(),
    try_restore_signed_in_session: vi.fn(),
    wait_for_clerk: vi.fn(),
  };
}

export function build_profile(
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    id: "profile-1",
    display_name: "Jane Doe",
    email: "jane@example.test",
    role: "org_admin",
    organization_id: "organization-1",
    organization_name: "City Hawks",
    team_id: "team-1",
    ...overrides,
  } as Record<string, unknown>;
}

export function build_auth_state(
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    current_token: { status: "missing" },
    current_profile: { status: "missing" },
    available_profiles: [],
    sidebar_menu_items: [],
    is_initialized: false,
    is_demo_session: false,
    ...overrides,
  } as Record<string, unknown>;
}

export function reset_auth_initialize_mocks(
  mocks: AuthInitializeMocks,
): boolean {
  mocks.set_signed_in(false);
  mocks.sync_branding_with_profile.mockReset();
  mocks.generate_token_for_profile.mockReset();
  mocks.load_saved_token.mockReset();
  mocks.load_sidebar_menu_for_role.mockReset();
  mocks.save_profile_id.mockReset();
  mocks.save_token.mockReset();
  mocks.sync_user_context_with_event_bus.mockReset();
  mocks.create_default_anonymous_state.mockReset();
  mocks.get_clerk_email.mockReset();
  mocks.load_available_profiles.mockReset();
  mocks.try_restore_anonymous_session.mockReset();
  mocks.try_restore_signed_in_session.mockReset();
  mocks.wait_for_clerk.mockReset();
  mocks.wait_for_clerk.mockImplementation(async () => {});
  mocks.load_available_profiles.mockResolvedValue([]);
  mocks.load_saved_token.mockResolvedValue({
    status: "missing",
  });
  mocks.load_sidebar_menu_for_role.mockResolvedValue([]);
  return true;
}
