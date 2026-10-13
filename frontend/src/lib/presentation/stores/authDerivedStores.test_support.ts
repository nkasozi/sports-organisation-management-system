import { type Mock, vi } from "vitest";

import {
  type AuthState,
  create_missing_auth_profile_state,
  create_missing_auth_token_state,
  type UserProfile,
} from "./authTypes";

type AuthStoreAuthorizationMocks = {
  get_authorization_level: Mock;
  is_authorized_to_execute: Mock;
  get_disabled_functionalities: Mock;
};

export function create_profile(
  overrides: Partial<UserProfile> = {},
): UserProfile {
  return {
    id: "profile-1",
    display_name: "Default User",
    email: "default@example.test",
    role: "org_admin",
    organization_id: "organization-1",
    organization_name: "City Hawks",
    team_id: "",
    ...overrides,
  } as UserProfile;
}

function create_initial_auth_state(): AuthState {
  return {
    current_token: { status: "missing" },
    current_profile: { status: "missing" },
    available_profiles: [],
    sidebar_menu_items: [],
    is_initialized: false,
    is_demo_session: false,
  } as AuthState;
}

type DelegatingAuthorization = {
  get_authorization_level: (entity_type: string) => unknown;
  is_authorized_to_execute: (
    action: string,
    entity_type: string,
    entity_id?: string,
    target_organization_id?: string,
    target_team_id?: string,
  ) => unknown;
  get_disabled_functionalities: (entity_type: string) => unknown;
};

type AuthStoreMock = AuthStoreAuthorizationMocks & {
  set_state: (next_value: AuthState) => void;
  auth_store: DelegatingAuthorization & {
    subscribe(subscriber: (value: AuthState) => void): () => void;
  };
};

function create_delegating_authorization(
  mocks: AuthStoreAuthorizationMocks,
): DelegatingAuthorization {
  return {
    get_authorization_level: (entity_type: string) =>
      mocks.get_authorization_level(entity_type),
    is_authorized_to_execute: (
      action: string,
      entity_type: string,
      entity_id?: string,
      target_organization_id?: string,
      target_team_id?: string,
    ) =>
      mocks.is_authorized_to_execute(
        action,
        entity_type,
        entity_id,
        target_organization_id,
        target_team_id,
      ),
    get_disabled_functionalities: (entity_type: string) =>
      mocks.get_disabled_functionalities(entity_type),
  };
}

function create_auth_store_mock(): AuthStoreMock {
  let current_value = create_initial_auth_state();
  const subscribers = new Set<(value: AuthState) => void>();
  const mocks: AuthStoreAuthorizationMocks = {
    get_authorization_level: vi.fn(),
    is_authorized_to_execute: vi.fn(),
    get_disabled_functionalities: vi.fn(),
  };

  return {
    set_state: (next_value: AuthState): void => {
      current_value = next_value;
      subscribers.forEach((subscriber) => subscriber(current_value));
    },
    ...mocks,
    auth_store: {
      subscribe(subscriber: (value: AuthState) => void): () => void {
        subscriber(current_value);
        subscribers.add(subscriber);
        return (): void => {
          subscribers.delete(subscriber);
        };
      },
      ...create_delegating_authorization(mocks),
    },
  };
}

export const authorization_ports_mock = {
  check_data_permission: vi.fn(),
};

export const auth_store_mock = create_auth_store_mock();

export function reset_auth_derived_store_mocks(): boolean {
  authorization_ports_mock.check_data_permission.mockReset();
  authorization_ports_mock.check_data_permission.mockReturnValue(true);
  auth_store_mock.get_authorization_level.mockReset();
  auth_store_mock.is_authorized_to_execute.mockReset();
  auth_store_mock.get_disabled_functionalities.mockReset();
  auth_store_mock.set_state({
    current_token: create_missing_auth_token_state(),
    current_profile: create_missing_auth_profile_state(),
    available_profiles: [],
    sidebar_menu_items: [],
    is_initialized: false,
    is_demo_session: false,
  });
  return true;
}
