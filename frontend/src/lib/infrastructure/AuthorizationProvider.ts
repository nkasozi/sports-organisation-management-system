import type { AuthorizationPort } from "$lib/core/interfaces/ports";
import {
  LocalAuthorizationAdapter,
  get_sidebar_menu_for_role,
  can_role_access_route,
  get_allowed_routes_for_role,
} from "$lib/adapters/iam/LocalAuthorizationAdapter";
import { get_authentication_adapter } from "$lib/adapters/iam/LocalAuthenticationAdapter";
import { get_system_user_repository } from "$lib/adapters/repositories/InBrowserSystemUserRepository";

export {
  get_sidebar_menu_for_role,
  can_role_access_route,
  get_allowed_routes_for_role,
};

let authorization_adapter_instance: AuthorizationPort | null = null;

export function get_authorization_adapter(): AuthorizationPort {
  if (!authorization_adapter_instance) {
    const auth_adapter = get_authentication_adapter(
      get_system_user_repository(),
    );
    authorization_adapter_instance = new LocalAuthorizationAdapter(
      auth_adapter,
    );
  }
  return authorization_adapter_instance;
}
