import type { BaseEntity, EntityStatus } from "./BaseEntity";

export interface FixtureOfficial extends BaseEntity {
  fixture_id: string;
  official_id: string;
  role_id: string;
  assignment_notes: string;
  confirmation_status: FixtureOfficialConfirmationStatus;
  status: EntityStatus;
}

export type FixtureOfficialConfirmationStatus =
  | "pending"
  | "confirmed"
  | "declined"
  | "replaced";

export type CreateFixtureOfficialInput = Omit<
  FixtureOfficial,
  "id" | "created_at" | "updated_at"
>;

export type UpdateFixtureOfficialInput = Partial<
  Omit<FixtureOfficial, "id" | "created_at" | "updated_at" | "fixture_id">
>;

export function create_empty_fixture_official_input(
  fixture_id: string = "",
): CreateFixtureOfficialInput {
  return {
    fixture_id,
    official_id: "",
    role_id: "",
    assignment_notes: "",
    confirmation_status: "pending",
    status: "active",
  };
}

export function validate_fixture_official_input(
  input: CreateFixtureOfficialInput | UpdateFixtureOfficialInput,
): { is_valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if ("fixture_id" in input && !input.fixture_id?.trim()) {
    errors.fixture_id = "Fixture is required";
  }

  if ("official_id" in input && !input.official_id?.trim()) {
    errors.official_id = "Official is required";
  }

  if ("role_id" in input && !input.role_id?.trim()) {
    errors.role_id = "Role is required";
  }

  if ("confirmation_status" in input && input.confirmation_status) {
    const valid_statuses: FixtureOfficialConfirmationStatus[] = [
      "pending",
      "confirmed",
      "declined",
      "replaced",
    ];
    if (
      !valid_statuses.includes(
        input.confirmation_status as FixtureOfficialConfirmationStatus,
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
