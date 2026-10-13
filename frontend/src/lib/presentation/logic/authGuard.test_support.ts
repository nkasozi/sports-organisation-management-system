import { vi } from "vitest";

type MockProfile = {
  id: string;
  display_name: string;
  email: string;
  role:
    | "super_admin"
    | "org_admin"
    | "officials_manager"
    | "team_manager"
    | "official"
    | "player"
    | "public_viewer";
  organization_id: string;
  organization_name: string;
  team_id: string;
  player_id?: string;
  official_id?: string;
};

type MockAuthState = {
  current_profile:
    | { status: "missing" }
    | { status: "present"; profile: MockProfile };
  is_initialized: boolean;
  current_token: { status: "missing" };
  available_profiles: never[];
  sidebar_menu_items: never[];
};

type MockAccessibleRoutesResult = {
  success: boolean;
  data: string[];
  error?: string;
};

const create_initial_auth_state = (): MockAuthState => ({
  current_profile: { status: "missing" },
  is_initialized: true,
  current_token: { status: "missing" },
  available_profiles: [],
  sidebar_menu_items: [],
});

let auth_state = create_initial_auth_state();
const auth_subscribers = new Set<(value: MockAuthState) => void>();

const publish_auth_state = (): void => {
  auth_subscribers.forEach((subscriber) => subscriber(auth_state));
};

export const set_auth_state = (
  next_state: Partial<MockAuthState>,
): MockAuthState => {
  auth_state = { ...auth_state, ...next_state };
  publish_auth_state();
  return auth_state;
};

const reset_auth_state = (): MockAuthState => {
  auth_state = create_initial_auth_state();
  publish_auth_state();
  return auth_state;
};

export const auth_store = {
  subscribe(subscriber: (value: MockAuthState) => void) {
    subscriber(auth_state);
    auth_subscribers.add(subscriber);
    return () => {
      auth_subscribers.delete(subscriber);
    };
  },
  initialize: vi.fn(async (): Promise<{ success: true; data: true }> => {
    set_auth_state({ is_initialized: true });
    return { success: true, data: true };
  }),
};

export const goto_mock = vi.fn();
export const set_denial_mock = vi.fn();
export const get_accessible_routes_for_role_mock = vi.fn(
  async (_role: string): Promise<MockAccessibleRoutesResult> => ({
    success: true,
    data: [],
  }),
);

export const create_profile = (
  overrides: Partial<MockProfile> = {},
): MockProfile => ({
  id: "profile-1",
  display_name: "Test User",
  email: "user@test.com",
  role: "player",
  organization_id: "org-1",
  organization_name: "Test Organisation",
  team_id: "team-1",
  ...overrides,
});

export const create_present_profile_state = (
  profile: MockProfile,
): MockAuthState["current_profile"] => ({
  status: "present",
  profile,
});

export function reset_auth_guard_mocks(): void {
  goto_mock.mockReset();
  set_denial_mock.mockReset();
  get_accessible_routes_for_role_mock.mockReset();
  get_accessible_routes_for_role_mock.mockResolvedValue({
    success: true,
    data: [],
  });
  auth_store.initialize.mockReset();
  auth_store.initialize.mockImplementation(
    async (): Promise<{ success: true; data: true }> => {
      set_auth_state({ is_initialized: true });
      return { success: true, data: true };
    },
  );
  reset_auth_state();
}
