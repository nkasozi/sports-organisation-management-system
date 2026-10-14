import {
  check_entity_permission,
  normalize_to_entity_type,
  type UserRole,
} from "$lib/core/interfaces/ports";
import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";
import { DYNAMIC_ENTITY_LIST_EVENT } from "$lib/presentation/logic/dynamicEntityListMessages";
import { normalize_dynamic_form_entity_type } from "$lib/presentation/logic/dynamicFormConstants";

export const LIST_READ_ACCESS_STATUS = {
  ALLOWED: "allowed",
  DENIED: "denied",
  UNVERIFIED: "unverified",
} as const;

type ListReadAccessStatus =
  (typeof LIST_READ_ACCESS_STATUS)[keyof typeof LIST_READ_ACCESS_STATUS];

const TOKENLESS_READER_ROLE: UserRole = "public_viewer";
const READ_ACTION = "read";

function evaluate_tokenless_read_access(
  entity_type: string,
): ListReadAccessStatus {
  return check_entity_permission(
    TOKENLESS_READER_ROLE,
    normalize_to_entity_type(entity_type),
    READ_ACTION,
  )
    ? LIST_READ_ACCESS_STATUS.ALLOWED
    : LIST_READ_ACCESS_STATUS.DENIED;
}

async function evaluate_token_read_access(
  raw_token: string,
  entity_type: string,
): Promise<ListReadAccessStatus> {
  const authorization_check =
    await get_authorization_adapter().check_entity_authorized(
      raw_token,
      entity_type,
      READ_ACTION,
    );
  if (!authorization_check.success) {
    console.warn("[DynamicEntityList] Read access could not be verified", {
      event: DYNAMIC_ENTITY_LIST_EVENT.READ_ACCESS_CHECK_FAILED,
      entity_type,
      error: authorization_check.error,
    });
    return LIST_READ_ACCESS_STATUS.UNVERIFIED;
  }
  return authorization_check.data.is_authorized
    ? LIST_READ_ACCESS_STATUS.ALLOWED
    : LIST_READ_ACCESS_STATUS.DENIED;
}

export function evaluate_dynamic_entity_list_read_access(
  raw_token: string,
  raw_entity_type: string,
): Promise<ListReadAccessStatus> {
  const entity_type = normalize_dynamic_form_entity_type(raw_entity_type);
  if (!raw_token)
    return Promise.resolve(evaluate_tokenless_read_access(entity_type));
  return evaluate_token_read_access(raw_token, entity_type);
}
