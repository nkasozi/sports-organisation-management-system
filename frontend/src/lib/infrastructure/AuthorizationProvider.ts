import { get_authentication_adapter } from "$lib/adapters/iam/LocalAuthenticationAdapter";
import { LocalAuthorizationAdapter } from "$lib/adapters/iam/LocalAuthorizationAdapter";
import { get_system_user_repository } from "$lib/adapters/repositories/InBrowserSystemUserRepository";
import type { AuthorizationPort } from "$lib/core/interfaces/ports";

import { CONTAINER_STATE_STATUS } from "./containerConstants";

type AuthorizationAdapterState =
  | { status: typeof CONTAINER_STATE_STATUS.UNINITIALIZED }
  | { status: typeof CONTAINER_STATE_STATUS.READY; adapter: AuthorizationPort };

let authorization_adapter_state: AuthorizationAdapterState = {
  status: CONTAINER_STATE_STATUS.UNINITIALIZED,
};

export function get_authorization_adapter(): AuthorizationPort {
  if (authorization_adapter_state.status === CONTAINER_STATE_STATUS.READY) {
    return authorization_adapter_state.adapter;
  }

  const system_user_repository = get_system_user_repository();
  const auth_adapter = get_authentication_adapter(system_user_repository);
  const adapter = new LocalAuthorizationAdapter(
    auth_adapter,
    system_user_repository,
  );
  authorization_adapter_state = {
    status: CONTAINER_STATE_STATUS.READY,
    adapter,
  };

  return adapter;
}
