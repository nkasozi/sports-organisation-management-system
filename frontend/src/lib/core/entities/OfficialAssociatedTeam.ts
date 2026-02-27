import type { BaseEntity, EntityStatus } from "./BaseEntity";

export interface OfficialAssociatedTeam extends BaseEntity {
  official_id: string;
  team_id: string;
  association_type: OfficialTeamAssociationType;
  start_date: string;
  end_date: string;
  notes: string;
  status: EntityStatus;
}

export type OfficialTeamAssociationType =
  | "current_member"
  | "former_member"
  | "family_connection"
  | "financial_interest"
  | "other";

export const OFFICIAL_TEAM_ASSOCIATION_TYPE_OPTIONS = [
  { value: "current_member", label: "Current Member" },
  { value: "former_member", label: "Former Member" },
  { value: "family_connection", label: "Family Connection" },
  { value: "financial_interest", label: "Financial Interest" },
  { value: "other", label: "Other" },
];

export type CreateOfficialAssociatedTeamInput = Omit<
  OfficialAssociatedTeam,
  "id" | "created_at" | "updated_at"
>;

export type UpdateOfficialAssociatedTeamInput =
  Partial<CreateOfficialAssociatedTeamInput>;

export function create_empty_official_associated_team_input(
  official_id: string = "",
): CreateOfficialAssociatedTeamInput {
  return {
    official_id,
    team_id: "",
    association_type: "current_member",
    start_date: "",
    end_date: "",
    notes: "",
    status: "active",
  };
}

export function validate_official_associated_team_input(
  input: CreateOfficialAssociatedTeamInput,
): string[] {
  const validation_errors: string[] = [];

  if (!input.official_id?.trim()) {
    validation_errors.push("Official is required");
  }

  if (!input.team_id?.trim()) {
    validation_errors.push("Team is required");
  }

  if (!input.association_type) {
    validation_errors.push("Association type is required");
  }

  const valid_association_types: OfficialTeamAssociationType[] = [
    "current_member",
    "former_member",
    "family_connection",
    "financial_interest",
    "other",
  ];

  if (!valid_association_types.includes(input.association_type)) {
    validation_errors.push("Invalid association type");
  }

  if (input.start_date && input.end_date) {
    const start = new Date(input.start_date);
    const end = new Date(input.end_date);
    if (end < start) {
      validation_errors.push("End date cannot be before start date");
    }
  }

  return validation_errors;
}

export function get_association_type_label(
  association_type: OfficialTeamAssociationType,
): string {
  const option = OFFICIAL_TEAM_ASSOCIATION_TYPE_OPTIONS.find(
    (opt) => opt.value === association_type,
  );
  return option?.label || association_type;
}
