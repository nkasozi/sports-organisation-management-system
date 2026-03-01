import type { BaseEntity, EntityStatus } from "./BaseEntity";

export interface OfficialAssignment {
  official_id: string;
  role_id: string;
}

export interface FixtureDetailsSetup extends BaseEntity {
  organization_id: string;
  fixture_id: string;
  home_team_jersey_id: string;
  away_team_jersey_id: string;
  official_jersey_id: string;
  assigned_officials: OfficialAssignment[];
  assignment_notes: string;
  confirmation_status: FixtureDetailsSetupConfirmationStatus;
  status: EntityStatus;
}

export type FixtureDetailsSetupConfirmationStatus =
  | "pending"
  | "confirmed"
  | "declined"
  | "replaced";

export type CreateFixtureDetailsSetupInput = Omit<
  FixtureDetailsSetup,
  "id" | "created_at" | "updated_at"
>;

export type UpdateFixtureDetailsSetupInput = Partial<
  Omit<FixtureDetailsSetup, "id" | "created_at" | "updated_at" | "fixture_id">
>;

export function create_empty_official_assignment(): OfficialAssignment {
  return {
    official_id: "",
    role_id: "",
  };
}

export function create_empty_fixture_details_setup_input(
  organization_id: string = "",
  fixture_id: string = "",
): CreateFixtureDetailsSetupInput {
  return {
    organization_id,
    fixture_id,
    home_team_jersey_id: "",
    away_team_jersey_id: "",
    official_jersey_id: "",
    assigned_officials: [create_empty_official_assignment()],
    assignment_notes: "",
    confirmation_status: "pending",
    status: "active",
  };
}

export function validate_fixture_details_setup_input(
  input: CreateFixtureDetailsSetupInput | UpdateFixtureDetailsSetupInput,
): { is_valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if ("organization_id" in input && !input.organization_id?.trim()) {
    errors.organization_id = "Organization is required";
  }

  if ("fixture_id" in input && !input.fixture_id?.trim()) {
    errors.fixture_id = "Fixture is required";
  }

  if ("assigned_officials" in input) {
    if (!input.assigned_officials || input.assigned_officials.length === 0) {
      errors.assigned_officials = "At least one official must be assigned";
    } else {
      for (let i = 0; i < input.assigned_officials.length; i++) {
        const assignment = input.assigned_officials[i];
        if (!assignment.official_id?.trim()) {
          errors[`assigned_officials_${i}_official`] =
            `Official ${i + 1} is required`;
        }
        if (!assignment.role_id?.trim()) {
          errors[`assigned_officials_${i}_role`] =
            `Role for official ${i + 1} is required`;
        }
      }
    }
  }

  if ("confirmation_status" in input && input.confirmation_status) {
    const valid_statuses: FixtureDetailsSetupConfirmationStatus[] = [
      "pending",
      "confirmed",
      "declined",
      "replaced",
    ];
    if (
      !valid_statuses.includes(
        input.confirmation_status as FixtureDetailsSetupConfirmationStatus,
      )
    ) {
      errors.confirmation_status = "Invalid confirmation status";
    }
  }

  return {
    is_valid: Object.keys(errors).length === 0,
    errors,
  };
}

export interface OfficialTeamConflict {
  official_id: string;
  official_name: string;
  team_id: string;
  team_name: string;
  association_type: string;
  message: string;
}

export interface OfficialWithAssociations {
  id: string;
  first_name: string;
  last_name: string;
  associated_team_ids: string[];
  association_details: {
    team_id: string;
    association_type: string;
  }[];
}

export function detect_official_team_conflicts(
  assigned_officials: OfficialAssignment[],
  officials_with_associations: OfficialWithAssociations[],
  home_team_id: string,
  away_team_id: string,
  home_team_name: string,
  away_team_name: string,
): OfficialTeamConflict[] {
  const conflicts: OfficialTeamConflict[] = [];
  const fixture_team_ids = new Set([home_team_id, away_team_id]);

  for (const assignment of assigned_officials) {
    if (!assignment.official_id) continue;

    const official = officials_with_associations.find(
      (o) => o.id === assignment.official_id,
    );

    if (!official) continue;

    for (const association of official.association_details) {
      if (fixture_team_ids.has(association.team_id)) {
        const team_name =
          association.team_id === home_team_id
            ? home_team_name
            : away_team_name;
        const official_name = `${official.first_name} ${official.last_name}`;

        conflicts.push({
          official_id: official.id,
          official_name,
          team_id: association.team_id,
          team_name,
          association_type: association.association_type,
          message: `${official_name} has a ${format_association_type_for_display(association.association_type)} with ${team_name}`,
        });
      }
    }
  }

  return conflicts;
}

function format_association_type_for_display(association_type: string): string {
  const type_labels: Record<string, string> = {
    current_member: "current membership",
    former_member: "former membership",
    family_connection: "family connection",
    financial_interest: "financial interest",
    other: "connection",
  };
  return type_labels[association_type] || "association";
}
