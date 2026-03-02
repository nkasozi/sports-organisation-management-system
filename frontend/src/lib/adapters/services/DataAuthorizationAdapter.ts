import type { AuthenticationPort } from "$lib/core/interfaces/ports/AuthenticationPort";
import {
  type DataAuthorizationPort,
  type AuthorizationResult,
  type DataAction,
  get_entity_data_category,
  check_data_permission,
  get_role_permissions,
} from "$lib/core/interfaces/ports/DataAuthorizationPort";
import { EventBus } from "$lib/infrastructure/events/EventBus";

export class DataAuthorizationAdapter implements DataAuthorizationPort {
  private auth_port: AuthenticationPort;

  constructor(auth_port: AuthenticationPort) {
    this.auth_port = auth_port;
  }

  async check_authorized(
    raw_token: string,
    entity_type: string,
    action: DataAction,
  ): Promise<AuthorizationResult> {
    const verification = await this.auth_port.verify_token(raw_token);

    if (!verification.is_valid || !verification.payload) {
      const is_expired = verification.error_message?.includes("expired");
      return {
        is_authorized: false,
        failure_reason: is_expired ? "token_expired" : "token_invalid",
        reason: verification.error_message || "Token verification failed",
      };
    }

    const role = verification.payload.role;
    const category = get_entity_data_category(entity_type);
    const is_authorized = check_data_permission(role, category, action);

    if (!is_authorized) {
      const denial_reason = `Role "${role}" does not have "${action}" permission for ${entity_type} (${category} data)`;

      EventBus.emit_access_denied(
        entity_type,
        "*",
        action,
        category,
        denial_reason,
        role,
      );

      return {
        is_authorized: false,
        failure_reason: "permission_denied",
        data_category: category,
        role,
        reason: denial_reason,
      };
    }

    return {
      is_authorized: true,
      data_category: category,
      role,
    };
  }

  async get_allowed_actions(
    raw_token: string,
    entity_type: string,
  ): Promise<DataAction[]> {
    const verification = await this.auth_port.verify_token(raw_token);

    if (!verification.is_valid || !verification.payload) {
      return [];
    }

    const role = verification.payload.role;
    const category = get_entity_data_category(entity_type);
    const permissions = get_role_permissions(role)[category];

    const allowed: DataAction[] = [];
    if (permissions.create) allowed.push("create");
    if (permissions.read) allowed.push("read");
    if (permissions.update) allowed.push("update");
    if (permissions.delete) allowed.push("delete");

    return allowed;
  }

  async get_disabled_actions(
    raw_token: string,
    entity_type: string,
  ): Promise<DataAction[]> {
    const verification = await this.auth_port.verify_token(raw_token);

    if (!verification.is_valid || !verification.payload) {
      return ["create", "read", "update", "delete"];
    }

    const role = verification.payload.role;
    const category = get_entity_data_category(entity_type);
    const permissions = get_role_permissions(role)[category];

    const disabled: DataAction[] = [];
    if (!permissions.create) disabled.push("create");
    if (!permissions.read) disabled.push("read");
    if (!permissions.update) disabled.push("update");
    if (!permissions.delete) disabled.push("delete");

    return disabled;
  }
}

import { get_authentication_adapter } from "./LocalAuthenticationAdapter";
import { get_system_user_repository } from "$lib/adapters/repositories/InBrowserSystemUserRepository";

let data_authorization_adapter_instance: DataAuthorizationAdapter | null = null;

export function get_data_authorization_adapter(): DataAuthorizationAdapter {
  if (!data_authorization_adapter_instance) {
    const auth_adapter = get_authentication_adapter(
      get_system_user_repository(),
    );
    data_authorization_adapter_instance = new DataAuthorizationAdapter(
      auth_adapter,
    );
  }
  return data_authorization_adapter_instance;
}
