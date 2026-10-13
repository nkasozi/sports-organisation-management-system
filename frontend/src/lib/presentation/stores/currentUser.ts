import { get, type Readable, writable } from "svelte/store";

import { browser } from "$app/environment";
import type { SystemUser } from "$lib/core/entities/SystemUser";
import type { ScalarInput } from "$lib/core/types/DomainScalars";
import {
  type EntityUpdatedPayload,
  EventBus,
} from "$lib/infrastructure/events/EventBus";
import { EVENT_TYPE } from "$lib/infrastructure/events/eventBusConstants";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import {
  CURRENT_USER_ENTITY_TYPE,
  CURRENT_USER_LOG_EVENTS,
} from "./currentUserConstants";
import {
  clear_current_user,
  type CurrentUserIdentifierState,
  type CurrentUserState,
  type CurrentUserStoreContext,
  initialize_current_user,
  read_current_user_id,
  set_current_user,
  update_current_user_from_entity_data,
  update_current_user_profile_picture,
} from "./currentUserStoreActions";

interface CurrentUserStore extends Readable<CurrentUserState> {
  initialize: () => Promise<void>;
  set_user: (user: ScalarInput<SystemUser>) => Promise<void>;
  clear: () => Promise<void>;
  update_profile_picture: (base64: string) => Promise<void>;
  update_from_entity_data: (
    entity_data: Record<string, unknown>,
  ) => Promise<void>;
  get_current_user_id: () => CurrentUserIdentifierState;
}

function create_current_user_store(): CurrentUserStore {
  const { subscribe, set } = writable<CurrentUserState>({
    status: PRESENCE_STATUS.MISSING,
  });
  const context: CurrentUserStoreContext = {
    read_state: (): CurrentUserState => get({ subscribe }),
    set,
  };

  return {
    subscribe,
    initialize: (): Promise<void> => initialize_current_user(context),
    set_user: (user: ScalarInput<SystemUser>): Promise<void> =>
      set_current_user(context, user),
    clear: (): Promise<void> => clear_current_user(context),
    update_profile_picture: (base64: string): Promise<void> =>
      update_current_user_profile_picture(context, base64),
    update_from_entity_data: (
      entity_data: Record<string, unknown>,
    ): Promise<void> =>
      update_current_user_from_entity_data(context, entity_data),
    get_current_user_id: (): CurrentUserIdentifierState =>
      read_current_user_id(context),
  };
}

export const current_user_store = create_current_user_store();

function handle_system_user_updated(payload: EntityUpdatedPayload): void {
  if (payload.entity_type !== CURRENT_USER_ENTITY_TYPE) return;

  const current_user_id_state = current_user_store.get_current_user_id();
  if (current_user_id_state.status !== PRESENCE_STATUS.PRESENT) return;

  if (payload.entity_id !== current_user_id_state.user_id) return;

  current_user_store
    .update_from_entity_data(payload.entity_data)
    .catch((error: unknown) => {
      console.error("[CurrentUser] Failed to apply entity update", {
        event: CURRENT_USER_LOG_EVENTS.ENTITY_UPDATE_SYNC_FAILED,
        user_id: current_user_id_state.user_id,
        error: String(error),
      });
    });
}

if (browser) {
  EventBus.subscribe<EntityUpdatedPayload>(
    EVENT_TYPE.ENTITY_UPDATED,
    handle_system_user_updated,
  );
}
