import {
  filter_official_roles_for_sport,
  type OfficialRoleSportScope,
  type SportScopedOfficialRole,
} from "$lib/core/services/officialRolesForSport";
import { type Option, OptionStatus } from "$lib/core/types/Option";

import {
  build_official_options_from_records,
  build_organization_official_filter,
  type OfficialRecord,
  type OrganizationOfficialFilter,
} from "./officialAssignmentLogic";
import { is_object_value } from "./runtimeTypeGuards";

export { compute_available_officials } from "./officialAssignmentLogic";

export type SelectOption = { value: string; label: string };

type OfficialRoleRecord = SportScopedOfficialRole;

const ROLE_PAGE_SIZE = 100;

type OfficialUseCases = {
  list: (
    filter: OrganizationOfficialFilter,
    options: { page_number: number; page_size: number },
  ) => Promise<{ success: boolean; data?: unknown }>;
};

type RoleUseCases = {
  list: (
    filter: OrganizationOfficialFilter,
    options: { page_number: number; page_size: number },
  ) => Promise<{ success: boolean; data?: unknown }>;
};

function normalize_items(data: unknown): Array<Record<string, string>> {
  if (Array.isArray(data)) return data as Array<Record<string, string>>;
  if (!is_object_value(data) || !("items" in data)) return [];
  const data_items = (data as { items?: unknown }).items;
  return Array.isArray(data_items)
    ? (data_items as Array<Record<string, string>>)
    : [];
}

function normalize_official_records(data: unknown): OfficialRecord[] {
  return normalize_items(data) as unknown as OfficialRecord[];
}

export async function reload_official_options(command: {
  organization_id: string;
  official_use_cases: OfficialUseCases;
}): Promise<SelectOption[]> {
  const officials_result = await command.official_use_cases.list(
    build_organization_official_filter(command.organization_id),
    { page_number: 1, page_size: 500 },
  );
  if (!officials_result.success || !officials_result.data) return [];
  return build_official_options_from_records(
    normalize_official_records(officials_result.data),
  );
}

export async function load_official_role_records(command: {
  organization_id: string;
  role_use_cases: RoleUseCases;
}): Promise<OfficialRoleRecord[]> {
  const roles_result = await command.role_use_cases.list(
    build_organization_official_filter(command.organization_id),
    { page_number: 1, page_size: ROLE_PAGE_SIZE },
  );
  if (!roles_result.success || !roles_result.data) return [];
  return normalize_items(roles_result.data) as unknown as OfficialRoleRecord[];
}

function scope_role_records(
  records: OfficialRoleRecord[],
  role_scope: Option<OfficialRoleSportScope>,
): OfficialRoleRecord[] {
  switch (role_scope.status) {
    case OptionStatus.NONE:
      return records;
    case OptionStatus.SOME:
      return filter_official_roles_for_sport({
        ...role_scope.value,
        roles: records,
      });
  }
}

export function build_scoped_role_options(
  records: OfficialRoleRecord[],
  role_scope: Option<OfficialRoleSportScope>,
): SelectOption[] {
  return scope_role_records(records, role_scope).map((role) => ({
    value: role.id,
    label: role.name,
  }));
}
