export const CLERK_PRESENCE_STATUS = {
  PRESENT: "present",
  MISSING: "missing",
} as const;

export interface ClerkUser {
  id: string;
  email_address: string;
  full_name: string;
  first_name: string;
  last_name: string;
  image_url?: string;
}

export type ClerkUserState =
  | { status: typeof CLERK_PRESENCE_STATUS.PRESENT; user: ClerkUser }
  | { status: typeof CLERK_PRESENCE_STATUS.MISSING };

export type ClerkSessionIdentifierState =
  | { status: typeof CLERK_PRESENCE_STATUS.PRESENT; session_id: string }
  | { status: typeof CLERK_PRESENCE_STATUS.MISSING };

export interface ClerkSessionState {
  is_loaded: boolean;
  is_signed_in: boolean;
  user_state: ClerkUserState;
  session_id_state: ClerkSessionIdentifierState;
}

export const INITIAL_CLERK_STATE: ClerkSessionState = {
  is_loaded: false,
  is_signed_in: false,
  user_state: { status: CLERK_PRESENCE_STATUS.MISSING },
  session_id_state: { status: CLERK_PRESENCE_STATUS.MISSING },
};

export const LOADED_SIGNED_OUT_CLERK_STATE: ClerkSessionState = {
  ...INITIAL_CLERK_STATE,
  is_loaded: true,
};
