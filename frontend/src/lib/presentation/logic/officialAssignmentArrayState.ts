import type { OfficialAssignment } from "$lib/core/entities/FixtureDetailsSetup";

export type SelectOption = { value: string; label: string };

type OfficialUseCases = {
  list: (
    filter: { organization_id: string } | undefined,
    options: { page_number: number; page_size: number },
  ) => Promise<{ success: boolean; data?: unknown }>;
};

type RoleUseCases = {
  list: (
    filter: { organization_id: string } | undefined,
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

export async function reload_official_options(command: {
  organization_id: string;
  official_use_cases: OfficialUseCases;
}): Promise<SelectOption[]> {
  const officials_result = await command.official_use_cases.list(
    command.organization_id
      ? { organization_id: command.organization_id }
      : undefined,
    { page_number: 1, page_size: 500 },
  );
  if (!officials_result.success || !officials_result.data) return [];
  return normalize_items(officials_result.data).map((official) => ({
    value: official.id,
    label: `${official.first_name} ${official.last_name}`,
  }));
}

export async function load_assignment_options(command: {
  organization_id: string;
  official_use_cases: OfficialUseCases;
  role_use_cases: RoleUseCases;
}): Promise<{
  official_options: SelectOption[];
  role_options: SelectOption[];
}> {
  const filter = command.organization_id
    ? { organization_id: command.organization_id }
    : undefined;
  const [officials_result, roles_result] = await Promise.all([
    command.official_use_cases.list(filter, { page_number: 1, page_size: 500 }),
    command.role_use_cases.list(filter, { page_number: 1, page_size: 100 }),
  ]);
  return {
    official_options:
      officials_result.success && officials_result.data
        ? normalize_items(officials_result.data).map((official) => ({
            value: official.id,
            label: `${official.first_name} ${official.last_name}`,
          }))
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

export function compute_available_officials(
  all_officials: SelectOption[],
  current_assignments: OfficialAssignment[],
  current_index: number,
): SelectOption[] {
  const assigned_official_ids = new Set(
    current_assignments
      .map((assignment, index) =>
        index !== current_index ? assignment.official_id : null,
      )
      .filter(
        (official_id): official_id is string =>
          official_id !== null && official_id !== "",
      ),
  );
  return all_officials.filter(
    (option) => !assigned_official_ids.has(option.value),
  );
}
