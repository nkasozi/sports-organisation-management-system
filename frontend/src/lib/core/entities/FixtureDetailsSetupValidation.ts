import { is_blank_text } from "./EntityValidation";
import type {
  CreateFixtureDetailsSetupInput,
  UpdateFixtureDetailsSetupInput,
} from "./FixtureDetailsSetup";
import { CONFIRMATION_STATUS } from "./StatusConstants";

const FIXTURE_DETAILS_SETUP_MESSAGES = {
  ORGANIZATION_REQUIRED: "Organization is required",
  FIXTURE_REQUIRED: "Fixture is required",
  OFFICIAL_ASSIGNMENT_REQUIRED: "At least one official must be assigned",
  INVALID_CONFIRMATION_STATUS: "Invalid confirmation status",
} as const;

type FixtureDetailsSetupValidationInput =
  | CreateFixtureDetailsSetupInput
  | UpdateFixtureDetailsSetupInput;

const VALID_CONFIRMATION_STATUSES: ReadonlySet<string> = new Set(
  Object.values(CONFIRMATION_STATUS),
);

export function validate_fixture_details_setup_input(
  input: FixtureDetailsSetupValidationInput,
): { is_valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {
    ...collect_identity_errors(input),
    ...collect_assignment_errors(input),
    ...collect_confirmation_status_errors(input),
  };
  return { is_valid: Object.keys(errors).length === 0, errors };
}

function collect_identity_errors(
  input: FixtureDetailsSetupValidationInput,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if ("organization_id" in input && is_blank_text(input.organization_id)) {
    errors.organization_id =
      FIXTURE_DETAILS_SETUP_MESSAGES.ORGANIZATION_REQUIRED;
  }
  if ("fixture_id" in input && is_blank_text(input.fixture_id)) {
    errors.fixture_id = FIXTURE_DETAILS_SETUP_MESSAGES.FIXTURE_REQUIRED;
  }
  return errors;
}

function collect_assignment_errors(
  input: FixtureDetailsSetupValidationInput,
): Record<string, string> {
  if (!("assigned_officials" in input)) {
    return {};
  }
  const assignments = input.assigned_officials ?? [];
  if (assignments.length === 0) {
    return {
      assigned_officials:
        FIXTURE_DETAILS_SETUP_MESSAGES.OFFICIAL_ASSIGNMENT_REQUIRED,
    };
  }
  return Object.fromEntries(
    assignments.flatMap((assignment, index) => [
      ...(is_blank_text(assignment.official_id)
        ? [
            [
              `assigned_officials_${index}_official`,
              `Official ${index + 1} is required`,
            ],
          ]
        : []),
      ...(is_blank_text(assignment.role_id)
        ? [
            [
              `assigned_officials_${index}_role`,
              `Role for official ${index + 1} is required`,
            ],
          ]
        : []),
    ]),
  );
}

function collect_confirmation_status_errors(
  input: FixtureDetailsSetupValidationInput,
): Record<string, string> {
  if (!("confirmation_status" in input) || !input.confirmation_status) {
    return {};
  }
  if (VALID_CONFIRMATION_STATUSES.has(input.confirmation_status)) {
    return {};
  }
  return {
    confirmation_status:
      FIXTURE_DETAILS_SETUP_MESSAGES.INVALID_CONFIRMATION_STATUS,
  };
}
