import { is_table_official_role } from "../entities/GameOfficialRoleTable";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "../types/Option";

export interface OfficialRequirementSource {
  role_id: string;
  role_name: string;
  minimum_count: number;
  is_mandatory: boolean;
}

export interface OfficialRoleSource {
  id: string;
  name: string;
  code: string;
  is_table_official?: boolean;
}

interface IdentifiedRecord {
  id: string;
}

interface OfficialSlotAssignment {
  official_id: string;
  role_id: string;
}

const MANDATORY_MINIMUM = 1;

function normalize_role_key(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

export function role_matches_requirement(
  requirement: Pick<OfficialRequirementSource, "role_id" | "role_name">,
  role: Pick<OfficialRoleSource, "name" | "code">,
): boolean {
  return (
    normalize_role_key(role.name) ===
      normalize_role_key(requirement.role_name) ||
    normalize_role_key(role.code) === normalize_role_key(requirement.role_id)
  );
}

function find_matching_role<T extends OfficialRoleSource>(
  requirement: OfficialRequirementSource,
  roles: readonly T[],
): Option<T> {
  const name_key = normalize_role_key(requirement.role_name);
  const code_key = normalize_role_key(requirement.role_id);
  const matching_roles = [
    ...roles.filter((role) => normalize_role_key(role.name) === name_key),
    ...roles.filter((role) => normalize_role_key(role.code) === code_key),
  ];
  return matching_roles.length > 0
    ? create_some_option(matching_roles[0])
    : create_none_option();
}

function build_requirement_slots<T extends OfficialRoleSource>(
  requirement: OfficialRequirementSource,
  roles: readonly T[],
): T[] {
  const role = find_matching_role(requirement, roles);
  switch (role.status) {
    case OptionStatus.NONE:
      return [];
    case OptionStatus.SOME:
      return Array.from(
        { length: required_count(requirement) },
        () => role.value,
      );
  }
}

function required_count(requirement: OfficialRequirementSource): number {
  return requirement.is_mandatory
    ? Math.max(requirement.minimum_count, MANDATORY_MINIMUM)
    : requirement.minimum_count;
}

function order_mandatory_first(
  requirements: readonly OfficialRequirementSource[],
): OfficialRequirementSource[] {
  return [
    ...requirements.filter((requirement) => requirement.is_mandatory),
    ...requirements.filter((requirement) => !requirement.is_mandatory),
  ];
}

export function build_official_role_slots<T extends OfficialRoleSource>(
  requirements: readonly OfficialRequirementSource[],
  roles: readonly T[],
): T[] {
  const slots = order_mandatory_first(requirements).flatMap((requirement) =>
    build_requirement_slots(requirement, roles),
  );
  if (slots.length === 0) return [...roles];
  if (slots.some(is_table_official_role)) return slots;
  const table_role = roles.find(is_table_official_role);
  return table_role ? [table_role, ...slots] : slots;
}

export function assign_officials_to_slots(
  officials: readonly IdentifiedRecord[],
  slots: readonly IdentifiedRecord[],
): OfficialSlotAssignment[] {
  return slots.slice(0, officials.length).map((slot, index) => ({
    official_id: officials[index].id,
    role_id: slot.id,
  }));
}
