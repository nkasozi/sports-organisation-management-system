import { type CallerScope, CallerScopeKind } from "./caller_scope";
import { type Option, OptionStatus } from "./option";
import {
  find_parent_scoped_write_rejection,
  type ParentOrganizationPair,
} from "./parent_scoped_write_ownership";
import {
  classify_record_organization,
  RecordOrganizationKind,
} from "./record_organization";
import {
  type WriteOwnershipDecision,
  WriteOwnershipRejection,
  type WriteOwnershipRejectionValue,
  WriteOwnershipStatus,
} from "./record_write_ownership_types";
import type { AllowedSyncTable } from "./sync_table_catalog";
import { SYSTEM_USERS_TABLE_NAME } from "./system_user_constants";
import {
  get_table_tenancy_strategy,
  TableTenancyStrategy,
} from "./table_tenancy";

export {
  WriteOwnershipRejection,
  WriteOwnershipStatus,
} from "./record_write_ownership_types";

const EMAIL_FIELD_NAME = "email";
const ORGANIZATION_FIELD_NAME = "organization_id";

interface RecordWriteOwnershipCommand {
  table_name: AllowedSyncTable;
  caller_scope: CallerScope;
  caller_email: string;
  local_id: string;
  incoming_record: Option<Record<string, unknown>>;
  existing_record: Option<Record<string, unknown>>;
  parent_organizations: ParentOrganizationPair;
}

function allow(record: Record<string, unknown>): WriteOwnershipDecision {
  return { status: WriteOwnershipStatus.ALLOWED, normalized_record: record };
}

function reject(
  rejection: WriteOwnershipRejectionValue,
): WriteOwnershipDecision {
  return { status: WriteOwnershipStatus.REJECTED, rejection };
}

function unwrap_record(
  record: Option<Record<string, unknown>>,
): Record<string, unknown> {
  return record.status === OptionStatus.SOME ? { ...record.value } : {};
}

function is_caller_own_system_user(
  command: RecordWriteOwnershipCommand,
): boolean {
  return (
    command.table_name === SYSTEM_USERS_TABLE_NAME &&
    command.existing_record.status === OptionStatus.SOME &&
    command.existing_record.value[EMAIL_FIELD_NAME] === command.caller_email
  );
}

function check_existing_owned_record(
  existing_record: Option<Record<string, unknown>>,
  organization_id: string,
): Option<WriteOwnershipRejectionValue> {
  if (existing_record.status === OptionStatus.NONE)
    return { status: OptionStatus.NONE };
  const existing_organization = classify_record_organization(
    existing_record.value,
  );
  switch (existing_organization.kind) {
    case RecordOrganizationKind.ORGANIZATION:
      return existing_organization.organization_id === organization_id
        ? { status: OptionStatus.NONE }
        : {
            status: OptionStatus.SOME,
            value: WriteOwnershipRejection.EXISTING_RECORD_FOREIGN,
          };
    case RecordOrganizationKind.GLOBAL:
    case RecordOrganizationKind.UNSCOPED:
      return {
        status: OptionStatus.SOME,
        value: WriteOwnershipRejection.EXISTING_RECORD_SHARED,
      };
  }
}

function normalize_incoming_owned_record(
  incoming_record: Record<string, unknown>,
  organization_id: string,
): WriteOwnershipDecision {
  const incoming_organization = classify_record_organization(incoming_record);
  switch (incoming_organization.kind) {
    case RecordOrganizationKind.UNSCOPED:
      return allow({
        ...incoming_record,
        [ORGANIZATION_FIELD_NAME]: organization_id,
      });
    case RecordOrganizationKind.GLOBAL:
      return reject(WriteOwnershipRejection.INCOMING_RECORD_GLOBAL);
    case RecordOrganizationKind.ORGANIZATION:
      return incoming_organization.organization_id === organization_id
        ? allow(incoming_record)
        : reject(WriteOwnershipRejection.INCOMING_RECORD_FOREIGN);
  }
}

function evaluate_organization_field_write(
  command: RecordWriteOwnershipCommand,
  organization_id: string,
): WriteOwnershipDecision {
  const existing_rejection = check_existing_owned_record(
    command.existing_record,
    organization_id,
  );
  if (existing_rejection.status === OptionStatus.SOME)
    return reject(existing_rejection.value);
  if (command.incoming_record.status === OptionStatus.NONE) return allow({});
  return normalize_incoming_owned_record(
    command.incoming_record.value,
    organization_id,
  );
}

function evaluate_parent_scoped_write(
  command: RecordWriteOwnershipCommand,
  organization_id: string,
): WriteOwnershipDecision {
  const parent_rejection = find_parent_scoped_write_rejection({
    ...command,
    organization_id,
  });
  return parent_rejection.status === OptionStatus.SOME
    ? reject(parent_rejection.value)
    : allow(unwrap_record(command.incoming_record));
}

function evaluate_organization_scoped_write(
  command: RecordWriteOwnershipCommand,
  organization_id: string,
): WriteOwnershipDecision {
  switch (get_table_tenancy_strategy(command.table_name)) {
    case TableTenancyStrategy.ORGANIZATION_FIELD:
    case TableTenancyStrategy.SHARED_REFERENCE:
      return evaluate_organization_field_write(command, organization_id);
    case TableTenancyStrategy.ORGANIZATION_IDENTITY:
      return command.local_id === organization_id
        ? allow(unwrap_record(command.incoming_record))
        : reject(WriteOwnershipRejection.ORGANIZATION_IDENTITY_FOREIGN);
    case TableTenancyStrategy.PARENT_SCOPED:
      return evaluate_parent_scoped_write(command, organization_id);
  }
}

export function evaluate_record_write_ownership(
  command: RecordWriteOwnershipCommand,
): WriteOwnershipDecision {
  const caller_scope = command.caller_scope;
  switch (caller_scope.kind) {
    case CallerScopeKind.GLOBAL:
      return allow(unwrap_record(command.incoming_record));
    case CallerScopeKind.ORGANIZATION:
      return evaluate_organization_scoped_write(
        command,
        caller_scope.organization_id,
      );
    case CallerScopeKind.NONE:
      return is_caller_own_system_user(command)
        ? allow(unwrap_record(command.incoming_record))
        : reject(WriteOwnershipRejection.CALLER_WITHOUT_SCOPE);
  }
}
