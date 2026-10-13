import type { Option } from "$lib/core/types/Option";
import { create_none_option, create_some_option } from "$lib/core/types/Option";

import type { ClerkSessionState } from "./clerkAuthTypes";

export const CLERK_STORE_DELIVERY_STATUS = {
  LIVE: "live",
  DEFERRED_DURING_NAVIGATION: "deferred_during_navigation",
} as const;

export type ClerkStoreDelivery =
  | { status: typeof CLERK_STORE_DELIVERY_STATUS.LIVE }
  | {
      status: typeof CLERK_STORE_DELIVERY_STATUS.DEFERRED_DURING_NAVIGATION;
      pending_state: Option<ClerkSessionState>;
    };

export interface ClerkStoreDeliveryStep {
  delivery: ClerkStoreDelivery;
  state_to_publish: Option<ClerkSessionState>;
}

export const LIVE_CLERK_STORE_DELIVERY: ClerkStoreDelivery = {
  status: CLERK_STORE_DELIVERY_STATUS.LIVE,
};

function get_pending_state(
  delivery: ClerkStoreDelivery,
): Option<ClerkSessionState> {
  switch (delivery.status) {
    case CLERK_STORE_DELIVERY_STATUS.LIVE:
      return create_none_option();
    case CLERK_STORE_DELIVERY_STATUS.DEFERRED_DURING_NAVIGATION:
      return delivery.pending_state;
  }
}

export function change_navigation_state(
  delivery: ClerkStoreDelivery,
  is_navigating: boolean,
): ClerkStoreDeliveryStep {
  const pending_state = get_pending_state(delivery);
  if (is_navigating)
    return {
      delivery: {
        status: CLERK_STORE_DELIVERY_STATUS.DEFERRED_DURING_NAVIGATION,
        pending_state,
      },
      state_to_publish: create_none_option(),
    };
  return {
    delivery: LIVE_CLERK_STORE_DELIVERY,
    state_to_publish: pending_state,
  };
}

export function deliver_clerk_state(
  delivery: ClerkStoreDelivery,
  new_state: ClerkSessionState,
): ClerkStoreDeliveryStep {
  switch (delivery.status) {
    case CLERK_STORE_DELIVERY_STATUS.LIVE:
      return { delivery, state_to_publish: create_some_option(new_state) };
    case CLERK_STORE_DELIVERY_STATUS.DEFERRED_DURING_NAVIGATION:
      return {
        delivery: { ...delivery, pending_state: create_some_option(new_state) },
        state_to_publish: create_none_option(),
      };
  }
}
