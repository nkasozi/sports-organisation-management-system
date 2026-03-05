import type { AuthorizationPort } from "$lib/core/interfaces/ports";
import { LocalAuthorizationAdapter } from "$lib/adapters/iam/LocalAuthorizationAdapter";
import { get_authentication_adapter } from "$lib/adapters/iam/LocalAuthenticationAdapter";
import { get_system_user_repository } from "$lib/adapters/repositories/InBrowserSystemUserRepository";

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
