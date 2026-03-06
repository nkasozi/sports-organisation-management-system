import type { OfficialAssignment } from "$lib/core/entities/FixtureDetailsSetup";

export interface SelectOption {
  value: string;
  label: string;
}

export interface OfficialRecord {
  id: string;
  first_name: string;
  last_name: string;
  organization_id: string;
}

export function build_official_options_from_records(
  officials: OfficialRecord[],
): SelectOption[] {
  return officials.map((official) => ({
    value: official.id,
    label: `${official.first_name} ${official.last_name}`,
  }));
}

export function filter_officials_by_organization(
  officials: OfficialRecord[],
  organization_id: string,
): OfficialRecord[] {
  if (!organization_id) return officials;
  return officials.filter(
    (official) => official.organization_id === organization_id,
  );
}

export function build_organization_official_filter(
  organization_id: string,
): { organization_id: string } | undefined {
  if (!organization_id) return undefined;
  return { organization_id };
}

export function compute_available_officials(
  all_officials: SelectOption[],
  current_assignments: OfficialAssignment[],
  current_index: number,
): SelectOption[] {
  const assigned_official_ids = new Set(
    current_assignments
      .map((a, i) => (i !== current_index ? a.official_id : null))
      .filter((id): id is string => id !== null && id !== ""),
  );

  return all_officials.filter(
    (option) => !assigned_official_ids.has(option.value),
  );
}

export function get_assignment_error(
  errors: Record<string, string>,
  index: number,
  field: string,
): string {
  return errors[`assigned_officials_${index}_${field}`] || "";
}
