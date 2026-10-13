import { GLOBAL_ORGANIZATION_ID, read_organization_id } from "./caller_scope";

const UNSCOPED_ORGANIZATION_ID = "";

export const RecordOrganizationKind = {
  UNSCOPED: "unscoped",
  GLOBAL: "global",
  ORGANIZATION: "organization",
} as const;

type RecordOrganization =
  | { kind: typeof RecordOrganizationKind.UNSCOPED }
  | { kind: typeof RecordOrganizationKind.GLOBAL }
  | {
      kind: typeof RecordOrganizationKind.ORGANIZATION;
      organization_id: string;
    };

export function classify_record_organization(
  record: Record<string, unknown>,
): RecordOrganization {
  const organization_id = read_organization_id(record);
  switch (organization_id) {
    case UNSCOPED_ORGANIZATION_ID:
      return { kind: RecordOrganizationKind.UNSCOPED };
    case GLOBAL_ORGANIZATION_ID:
      return { kind: RecordOrganizationKind.GLOBAL };
    default:
      return { kind: RecordOrganizationKind.ORGANIZATION, organization_id };
  }
}
