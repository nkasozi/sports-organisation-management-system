export interface ClerkUser {
  id: string;
  email_address: string;
  full_name: string;
  first_name: string;
  last_name: string;
  image_url?: string;
}

export interface ClerkSessionState {
  is_loaded: boolean;
  is_signed_in: boolean;
  user: ClerkUser | null;
  session_id: string | null;
}

export const INITIAL_CLERK_STATE: ClerkSessionState = {
  is_loaded: false,
  is_signed_in: false,
  user: null,
  session_id: null,
};
