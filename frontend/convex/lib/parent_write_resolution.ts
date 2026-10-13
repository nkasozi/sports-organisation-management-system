import type { MutationCtx } from "../_generated/server";
import { type CallerScope, CallerScopeKind } from "./caller_scope";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "./option";
import {
  type ParentOrganizationResolution,
  type ParentRecordLookup,
  resolve_parent_organization,
} from "./parent_organization_resolution";
import {
  create_database_parent_row_loader,
  load_parent_record_lookup,
} from "./parent_record_loading";
import {
  is_parent_scoped_table,
  type ParentScopedTable,
} from "./parent_reference_specs";
import type { ParentOrganizationPair } from "./parent_scoped_write_ownership";

interface ParentWriteResolutionCommand {
  table_name: string;
  caller_scope: CallerScope;
  incoming_record: Option<Record<string, unknown>>;
  existing_record: Option<Record<string, unknown>>;
}

const UNRESOLVED_PAIR: ParentOrganizationPair = {
  existing: create_none_option(),
  incoming: create_none_option(),
};

function merge_incoming_over_existing(
  incoming_record: Option<Record<string, unknown>>,
  existing_record: Option<Record<string, unknown>>,
): Option<Record<string, unknown>> {
  if (incoming_record.status === OptionStatus.NONE) return create_none_option();
  const existing_values =
    existing_record.status === OptionStatus.SOME ? existing_record.value : {};
  return create_some_option({ ...existing_values, ...incoming_record.value });
}

function resolve_optional_record(
  table_name: ParentScopedTable,
  record: Option<Record<string, unknown>>,
  lookup: ParentRecordLookup,
): Option<ParentOrganizationResolution> {
  return record.status === OptionStatus.SOME
    ? create_some_option(
        resolve_parent_organization(table_name, record.value, lookup),
      )
    : create_none_option();
}

export async function resolve_write_parent_organizations(
  ctx: MutationCtx,
  command: ParentWriteResolutionCommand,
): Promise<ParentOrganizationPair> {
  const table_name = command.table_name;
  if (!is_parent_scoped_table(table_name)) return UNRESOLVED_PAIR;
  if (command.caller_scope.kind !== CallerScopeKind.ORGANIZATION)
    return UNRESOLVED_PAIR;
  const merged_incoming = merge_incoming_over_existing(
    command.incoming_record,
    command.existing_record,
  );
  const records = [command.existing_record, merged_incoming].flatMap(
    (record) => (record.status === OptionStatus.SOME ? [record.value] : []),
  );
  const lookup = await load_parent_record_lookup(
    create_database_parent_row_loader(ctx),
    table_name,
    records,
  );
  return {
    existing: resolve_optional_record(
      table_name,
      command.existing_record,
      lookup,
    ),
    incoming: resolve_optional_record(table_name, merged_incoming, lookup),
  };
}
