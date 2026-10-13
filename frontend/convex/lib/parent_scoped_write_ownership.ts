import { type Option, OptionStatus } from "./option";
import {
  type ParentOrganizationResolution,
  ParentResolutionKind,
} from "./parent_organization_resolution";

export const ParentWriteRejection = {
  PARENT_UNRESOLVED: "parent_unresolved",
  PARENT_FOREIGN: "parent_foreign",
} as const;

type ParentWriteRejectionValue =
  (typeof ParentWriteRejection)[keyof typeof ParentWriteRejection];

export interface ParentOrganizationPair {
  existing: Option<ParentOrganizationResolution>;
  incoming: Option<ParentOrganizationResolution>;
}

interface ParentScopedWriteCommand {
  organization_id: string;
  incoming_record: Option<Record<string, unknown>>;
  existing_record: Option<Record<string, unknown>>;
  parent_organizations: ParentOrganizationPair;
}

function check_parent_resolution(
  record: Option<Record<string, unknown>>,
  resolution: Option<ParentOrganizationResolution>,
  organization_id: string,
): Option<ParentWriteRejectionValue> {
  if (record.status === OptionStatus.NONE) return { status: OptionStatus.NONE };
  if (resolution.status === OptionStatus.NONE)
    return {
      status: OptionStatus.SOME,
      value: ParentWriteRejection.PARENT_UNRESOLVED,
    };
  const parent_resolution = resolution.value;
  switch (parent_resolution.kind) {
    case ParentResolutionKind.RESOLVED_ORGANIZATION:
      return parent_resolution.organization_id === organization_id
        ? { status: OptionStatus.NONE }
        : {
            status: OptionStatus.SOME,
            value: ParentWriteRejection.PARENT_FOREIGN,
          };
    case ParentResolutionKind.PARENT_REFERENCE_MISSING:
    case ParentResolutionKind.UNSUPPORTED_PARENT_TYPE:
    case ParentResolutionKind.PARENT_NOT_FOUND:
    case ParentResolutionKind.PARENT_AMBIGUOUS:
    case ParentResolutionKind.PARENT_SHARED:
    case ParentResolutionKind.PARENT_CHAIN_TOO_DEEP:
      return {
        status: OptionStatus.SOME,
        value: ParentWriteRejection.PARENT_UNRESOLVED,
      };
  }
}

export function find_parent_scoped_write_rejection(
  command: ParentScopedWriteCommand,
): Option<ParentWriteRejectionValue> {
  const existing_rejection = check_parent_resolution(
    command.existing_record,
    command.parent_organizations.existing,
    command.organization_id,
  );
  if (existing_rejection.status === OptionStatus.SOME)
    return existing_rejection;
  return check_parent_resolution(
    command.incoming_record,
    command.parent_organizations.incoming,
    command.organization_id,
  );
}
