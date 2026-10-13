import type { AuthToken } from "$lib/core/interfaces/ports";

import { type UserProfile } from "./authTypes";

export type TestStore<TValue> = {
  set: (value: TValue) => void;
  subscribe: (run: (value: TValue) => void) => () => void;
};

export type ClerkSessionValue = {
  user_state:
    | { status: "present"; user: { email_address?: string } }
    | { status: "missing" };
};

export function create_profile(
  overrides: Partial<UserProfile> = {},
): UserProfile {
  return {
    id: "profile_1",
    display_name: "Admin User",
    email: "admin@example.com",
    role: "org_admin",
    organization_id: "organization-1",
    organization_name: "Premier League",
    team_id: "",
    ...overrides,
  } as UserProfile;
}

export function create_auth_token(
  user_id: string = "profile_1",
  raw_token: string = "a.b.signature",
): AuthToken {
  return {
    payload: {
      user_id,
      email: "admin@example.com",
      display_name: "Admin User",
      role: "org_admin",
      organization_id: "organization-1",
      team_id: "",
      issued_at: 1,
      expires_at: 2,
    },
    signature: "signature",
    raw_token,
  } as AuthToken;
}
