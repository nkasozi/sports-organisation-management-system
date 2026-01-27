import type { OfficialAssignment } from "$lib/core/entities/FixtureDetailsSetup";

export interface SelectOption {
  value: string;
  label: string;
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
