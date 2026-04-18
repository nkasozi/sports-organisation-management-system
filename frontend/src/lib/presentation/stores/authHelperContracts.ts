import type { UserProfile } from "./authTypes";

export type SavedProfileIdState =
  | { status: "present"; profile_id: UserProfile["id"] }
  | { status: "missing" };

export type SavedTokenState =
  | { status: "present"; raw_token: string }
  | { status: "missing" };

export type EventBusUserContextState =
  | { status: "cleared" }
  | { status: "present"; profile: UserProfile };
