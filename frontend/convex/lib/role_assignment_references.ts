import type { QueryCtx } from "../_generated/server";
import { read_organization_id } from "./caller_scope";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "./option";
import { GLOBAL_ORGANIZATION_ID } from "./system_user_constants";

const ROLE_REFERENCE_TABLES = {
  team_id: "teams",
  player_id: "players",
  official_id: "officials",
} as const;

export type RoleReferenceField = keyof typeof ROLE_REFERENCE_TABLES;

const ROLE_REFERENCE_FIELDS = Object.keys(
  ROLE_REFERENCE_TABLES,
) as RoleReferenceField[];
const LOCAL_ID_INDEX_NAME = "by_local_id";
const LOCAL_ID_FIELD = "local_id";
const CLEARED_REFERENCE_VALUE = "";

const RoleReferenceRejection = {
  GLOBAL_REFERENCE_OUTSIDE_GLOBAL_SCOPE:
    "global_reference_outside_global_scope",
  REFERENCE_NOT_FOUND: "reference_not_found",
  REFERENCE_FOREIGN: "reference_foreign",
} as const;

type RoleReferenceRejectionValue =
  (typeof RoleReferenceRejection)[keyof typeof RoleReferenceRejection];

interface RoleReferenceCommand {
  target_organization_id: string;
  organization_changed: boolean;
  supplied: Record<RoleReferenceField, Option<string>>;
  current: Record<RoleReferenceField, string>;
}

interface RoleReferenceRejectionDetail {
  field_name: RoleReferenceField;
  rejection: RoleReferenceRejectionValue;
}

function resolve_reference_to_validate(
  command: RoleReferenceCommand,
  field_name: RoleReferenceField,
): Option<string> {
  const supplied_value = command.supplied[field_name];
  if (supplied_value.status === OptionStatus.SOME) return supplied_value;
  return command.organization_changed
    ? create_some_option(command.current[field_name])
    : create_none_option();
}

async function load_reference_organization(
  ctx: { db: QueryCtx["db"] },
  field_name: RoleReferenceField,
  reference_value: string,
): Promise<Option<string>> {
  const referenced_record = await ctx.db
    .query(ROLE_REFERENCE_TABLES[field_name])
    .withIndex(LOCAL_ID_INDEX_NAME, (query) =>
      query.eq(LOCAL_ID_FIELD, reference_value),
    )
    .first();
  return referenced_record
    ? create_some_option(read_organization_id(referenced_record))
    : create_none_option();
}

async function check_reference(
  ctx: { db: QueryCtx["db"] },
  command: RoleReferenceCommand,
  field_name: RoleReferenceField,
  reference_value: string,
): Promise<Option<RoleReferenceRejectionValue>> {
  if (reference_value === CLEARED_REFERENCE_VALUE) return create_none_option();
  if (reference_value === GLOBAL_ORGANIZATION_ID)
    return command.target_organization_id === GLOBAL_ORGANIZATION_ID
      ? create_none_option()
      : create_some_option(
          RoleReferenceRejection.GLOBAL_REFERENCE_OUTSIDE_GLOBAL_SCOPE,
        );
  const owner = await load_reference_organization(
    ctx,
    field_name,
    reference_value,
  );
  if (owner.status === OptionStatus.NONE)
    return create_some_option(RoleReferenceRejection.REFERENCE_NOT_FOUND);
  return owner.value === command.target_organization_id
    ? create_none_option()
    : create_some_option(RoleReferenceRejection.REFERENCE_FOREIGN);
}

export async function find_role_reference_rejection(
  ctx: { db: QueryCtx["db"] },
  command: RoleReferenceCommand,
): Promise<Option<RoleReferenceRejectionDetail>> {
  for (const field_name of ROLE_REFERENCE_FIELDS) {
    const reference = resolve_reference_to_validate(command, field_name);
    if (reference.status === OptionStatus.NONE) continue;
    const rejection = await check_reference(
      ctx,
      command,
      field_name,
      reference.value,
    );
    if (rejection.status === OptionStatus.SOME)
      return create_some_option({ field_name, rejection: rejection.value });
  }
  return create_none_option();
}
