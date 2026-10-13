import type { SharedUserRole } from "./shared_permission_definitions";

const SHARED_VERIFICATION_FIELD_NAME = "is_verified";

const SHARED_VERIFYING_ROLES: readonly SharedUserRole[] = [
  "super_admin",
  "org_admin",
  "officials_manager",
];

export function can_role_change_verification(role: string): boolean {
  return SHARED_VERIFYING_ROLES.some(
    (verifying_role) => verifying_role === role,
  );
}

function read_verification_flag(
  record: Readonly<Record<string, unknown>>,
): boolean {
  return record[SHARED_VERIFICATION_FIELD_NAME] === true;
}

function changes_verification(
  incoming_record: Readonly<Record<string, unknown>>,
  existing_record: Readonly<Record<string, unknown>>,
): boolean {
  if (!(SHARED_VERIFICATION_FIELD_NAME in incoming_record)) return false;
  return (
    read_verification_flag(incoming_record) !==
    read_verification_flag(existing_record)
  );
}

export function is_verification_change_permitted(
  role: string,
  incoming_record: Readonly<Record<string, unknown>>,
  existing_record: Readonly<Record<string, unknown>>,
): boolean {
  return (
    can_role_change_verification(role) ||
    !changes_verification(incoming_record, existing_record)
  );
}
