import {
  build_official_options_from_records,
  build_organization_official_filter,
  type OfficialRecord,
  type OrganizationOfficialFilter,
} from "./officialAssignmentLogic";

export { compute_available_officials } from "./officialAssignmentLogic";

export type SelectOption = { value: string; label: string };

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
  if (data && typeof data === "object" && "items" in data) {
    const data_items = (data as { items?: unknown }).items;
    return Array.isArray(data_items)
      ? (data_items as Array<Record<string, string>>)
      : [];
  }
  return [];
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

export async function load_assignment_options(command: {
  organization_id: string;
  official_use_cases: OfficialUseCases;
  role_use_cases: RoleUseCases;
}): Promise<{
  official_options: SelectOption[];
  role_options: SelectOption[];
}> {
  const filter = build_organization_official_filter(command.organization_id);
  const [officials_result, roles_result] = await Promise.all([
    command.official_use_cases.list(filter, { page_number: 1, page_size: 500 }),
    command.role_use_cases.list(filter, { page_number: 1, page_size: 100 }),
  ]);
  return {
    official_options:
      officials_result.success && officials_result.data
        ? build_official_options_from_records(
            normalize_official_records(officials_result.data),
          )
        : [],
    role_options:
      roles_result.success && roles_result.data
        ? normalize_items(roles_result.data).map((role) => ({
            value: role.id,
            label: role.name,
          }))
        : [],
  };
}
