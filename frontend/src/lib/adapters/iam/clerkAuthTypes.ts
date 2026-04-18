export interface ClerkUser {
  id: string;
  email_address: string;
  full_name: string;
  first_name: string;
  last_name: string;
  image_url?: string;
}

export type ClerkUserState =
  | { status: "present"; user: ClerkUser }
  | { status: "missing" };

export type ClerkSessionIdentifierState =
  | { status: "present"; session_id: string }
  | { status: "missing" };

export interface ClerkSessionState {
  is_loaded: boolean;
  is_signed_in: boolean;
  user_state: ClerkUserState;
  session_id_state: ClerkSessionIdentifierState;
}

export const INITIAL_CLERK_STATE: ClerkSessionState = {
  is_loaded: false,
  is_signed_in: false,
  user_state: { status: "missing" },
  session_id_state: { status: "missing" },
};
