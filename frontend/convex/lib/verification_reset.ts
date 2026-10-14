import {
  can_role_change_verification,
  is_verification_change_permitted,
} from "../shared_verification_policy";
import { has_meaningful_changes } from "../sync_record_helpers";
import { type Option, OptionStatus } from "./option";

const VERIFICATION_FIELD_NAME = "is_verified";
const VERIFICATION_RESET_EVENT = "verification_reset_on_identity_change";

const SHARED_HOLDER_FIELD_NAMES = [
  "holder_type",
  "holder_id",
  "issue_date",
  "expiry_date",
  "document_url",
];

const IDENTITY_FIELD_NAMES_BY_TABLE: Readonly<
  Record<string, readonly string[]>
> = {
  identifications: [
    ...SHARED_HOLDER_FIELD_NAMES,
    "identification_type_id",
    "identification_number",
    "identifier_value",
    "document_image_url",
  ],
  qualifications: [
    ...SHARED_HOLDER_FIELD_NAMES,
    "name",
    "certification_name",
    "certification_level",
    "certification_number",
    "issuing_authority",
    "issuing_body",
  ],
};

const EMPTY_RECORD: Readonly<Record<string, unknown>> = {};

interface VerificationChangeCommand {
  table_name: string;
  caller: { role: string };
  incoming_record: Option<Record<string, unknown>>;
  existing_record: Option<Record<string, unknown>>;
}

function is_verifiable_table(table_name: string): boolean {
  return Object.prototype.hasOwnProperty.call(
    IDENTITY_FIELD_NAMES_BY_TABLE,
    table_name,
  );
}

export function blocks_verification_change(
  command: VerificationChangeCommand,
): boolean {
  if (!is_verifiable_table(command.table_name)) return false;
  if (command.incoming_record.status === OptionStatus.NONE) return false;
  const existing_record =
    command.existing_record.status === OptionStatus.SOME
      ? command.existing_record.value
      : EMPTY_RECORD;
  return !is_verification_change_permitted(
    command.caller.role,
    command.incoming_record.value,
    existing_record,
  );
}

interface VerificationResetCommand {
  table_name: string;
  caller_role: string;
  local_id: string;
  record_data: Record<string, unknown>;
  existing_record: Option<Record<string, unknown>>;
}

function pick_present_fields(
  record: Record<string, unknown>,
  field_names: readonly string[],
): Record<string, unknown> {
  return Object.fromEntries(
    field_names
      .filter((field_name) => field_name in record)
      .map((field_name) => [field_name, record[field_name]]),
  );
}

function changes_identity_of_verified_record(
  command: VerificationResetCommand,
  identity_field_names: readonly string[],
): boolean {
  if (command.existing_record.status === OptionStatus.NONE) return false;
  const existing_record = command.existing_record.value;
  if (existing_record[VERIFICATION_FIELD_NAME] !== true) return false;
  return has_meaningful_changes(
    pick_present_fields(command.record_data, identity_field_names),
    existing_record,
  );
}

export function reset_verification_on_identity_change(
  command: VerificationResetCommand,
): Record<string, unknown> {
  if (!is_verifiable_table(command.table_name)) return command.record_data;
  if (can_role_change_verification(command.caller_role))
    return command.record_data;
  const identity_field_names =
    IDENTITY_FIELD_NAMES_BY_TABLE[command.table_name];
  if (!changes_identity_of_verified_record(command, identity_field_names))
    return command.record_data;
  console.warn("[VerificationReset] Verified record identity changed", {
    event: VERIFICATION_RESET_EVENT,
    table_name: command.table_name,
    local_id: command.local_id,
    role: command.caller_role,
  });
  return { ...command.record_data, [VERIFICATION_FIELD_NAME]: false };
}
