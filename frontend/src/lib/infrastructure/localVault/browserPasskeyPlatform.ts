import {
  create_none_option,
  create_some_option,
  type Option,
} from "$lib/core/types/Option";

import type { PasskeyPlatform } from "./passkeyPrfTypes";

const PUBLIC_KEY_CREDENTIAL_GLOBAL_NAME = "PublicKeyCredential";
const NAVIGATOR_GLOBAL_NAME = "navigator";
const FUNCTION_TYPE_NAME = "function";

function read_client_capabilities(
  credential_class: typeof PublicKeyCredential,
): Promise<Record<string, boolean>> {
  return typeof credential_class.getClientCapabilities === FUNCTION_TYPE_NAME
    ? credential_class.getClientCapabilities()
    : Promise.resolve({});
}

export function read_browser_passkey_platform(): Option<PasskeyPlatform> {
  if (!(PUBLIC_KEY_CREDENTIAL_GLOBAL_NAME in globalThis))
    return create_none_option();
  if (!(NAVIGATOR_GLOBAL_NAME in globalThis) || !navigator.credentials)
    return create_none_option();
  const credential_class = globalThis.PublicKeyCredential;
  return create_some_option({
    credentials: navigator.credentials,
    capability_checks: {
      is_platform_authenticator_available: () =>
        credential_class.isUserVerifyingPlatformAuthenticatorAvailable(),
      read_client_capabilities: () =>
        read_client_capabilities(credential_class),
    },
  });
}
