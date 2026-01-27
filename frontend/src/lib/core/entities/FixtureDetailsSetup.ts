import type { BaseEntity, EntityStatus } from "./BaseEntity";

export interface OfficialAssignment {
  official_id: string;
  role_id: string;
}

export interface FixtureDetailsSetup extends BaseEntity {
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
  fixture_id: string = "",
): CreateFixtureDetailsSetupInput {
  return {
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
