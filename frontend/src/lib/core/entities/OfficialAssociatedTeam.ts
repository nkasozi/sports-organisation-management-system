import type {
  EntityId,
  IsoDateString,
  ScalarInput,
} from "../types/DomainScalars";
import type { BaseEntity, EntityStatus } from "./BaseEntity";
import {
  check_condition,
  collect_validation_errors,
  type FieldCheck,
  is_blank_text,
} from "./EntityValidation";

export interface OfficialAssociatedTeam extends BaseEntity {
  official_id: EntityId;
  team_id: EntityId;
  association_type: OfficialTeamAssociationType;
  start_date: IsoDateString;
  end_date: IsoDateString;
  notes: string;
  status: EntityStatus;
}

export const OFFICIAL_TEAM_ASSOCIATION_TYPE = {
  CURRENT_MEMBER: "current_member",
  FORMER_MEMBER: "former_member",
  FAMILY_CONNECTION: "family_connection",
  FINANCIAL_INTEREST: "financial_interest",
  OTHER: "other",
} as const;

export type OfficialTeamAssociationType =
  (typeof OFFICIAL_TEAM_ASSOCIATION_TYPE)[keyof typeof OFFICIAL_TEAM_ASSOCIATION_TYPE];

const OFFICIAL_TEAM_ASSOCIATION_TYPE_LABELS: Readonly<
  Record<OfficialTeamAssociationType, string>
> = {
  current_member: "Current Member",
  former_member: "Former Member",
  family_connection: "Family Connection",
  financial_interest: "Financial Interest",
  other: "Other",
};

const VALID_ASSOCIATION_TYPES: ReadonlySet<string> = new Set(
  Object.values(OFFICIAL_TEAM_ASSOCIATION_TYPE),
);

const OFFICIAL_ASSOCIATED_TEAM_MESSAGES = {
  OFFICIAL_REQUIRED: "Official is required",
  TEAM_REQUIRED: "Team is required",
  ASSOCIATION_TYPE_REQUIRED: "Association type is required",
  ASSOCIATION_TYPE_INVALID: "Invalid association type",
  END_BEFORE_START: "End date cannot be before start date",
} as const;

export const OFFICIAL_TEAM_ASSOCIATION_TYPE_OPTIONS: {
  value: OfficialTeamAssociationType;
  label: string;
}[] = Object.values(OFFICIAL_TEAM_ASSOCIATION_TYPE).map((value) => ({
  value,
  label: OFFICIAL_TEAM_ASSOCIATION_TYPE_LABELS[value],
}));

export type CreateOfficialAssociatedTeamInput = Omit<
  ScalarInput<OfficialAssociatedTeam>,
  "id" | "created_at" | "updated_at"
>;

export type UpdateOfficialAssociatedTeamInput =
  Partial<CreateOfficialAssociatedTeamInput>;

export function validate_official_associated_team_input(
  input: CreateOfficialAssociatedTeamInput,
): string[] {
  return collect_validation_errors([
    check_condition(
      !is_blank_text(input.official_id),
      OFFICIAL_ASSOCIATED_TEAM_MESSAGES.OFFICIAL_REQUIRED,
    ),
    check_condition(
      !is_blank_text(input.team_id),
      OFFICIAL_ASSOCIATED_TEAM_MESSAGES.TEAM_REQUIRED,
    ),
    check_condition(
      Boolean(input.association_type),
      OFFICIAL_ASSOCIATED_TEAM_MESSAGES.ASSOCIATION_TYPE_REQUIRED,
    ),
    check_condition(
      VALID_ASSOCIATION_TYPES.has(input.association_type),
      OFFICIAL_ASSOCIATED_TEAM_MESSAGES.ASSOCIATION_TYPE_INVALID,
    ),
    check_association_date_order(input),
  ]);
}

function check_association_date_order(
  input: CreateOfficialAssociatedTeamInput,
): FieldCheck {
  const has_both_dates = Boolean(input.start_date) && Boolean(input.end_date);
  return check_condition(
    !has_both_dates || new Date(input.end_date) >= new Date(input.start_date),
    OFFICIAL_ASSOCIATED_TEAM_MESSAGES.END_BEFORE_START,
  );
}
