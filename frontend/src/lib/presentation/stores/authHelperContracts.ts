import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import { EVENT_BUS_USER_CONTEXT_STATUS } from "./authStoreConstants";
import type { UserProfile } from "./authTypes";

export type SavedProfileIdState =
  | { status: typeof PRESENCE_STATUS.PRESENT; profile_id: UserProfile["id"] }
  | { status: typeof PRESENCE_STATUS.MISSING };

export type SavedTokenState =
  | { status: typeof PRESENCE_STATUS.PRESENT; raw_token: string }
  | { status: typeof PRESENCE_STATUS.MISSING };

export type EventBusUserContextState =
  | { status: typeof EVENT_BUS_USER_CONTEXT_STATUS.CLEARED }
  | { status: typeof PRESENCE_STATUS.PRESENT; profile: UserProfile };
