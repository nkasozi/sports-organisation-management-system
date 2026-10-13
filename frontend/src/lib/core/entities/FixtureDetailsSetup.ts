import type { EntityId, Name, ScalarInput } from "../types/DomainScalars";
import type { BaseEntity, EntityStatus } from "./BaseEntity";
import type { OfficialTeamAssociationType } from "./OfficialAssociatedTeam";
import {
  CONFIRMATION_STATUS,
  type ConfirmationStatusValue,
  ENTITY_STATUS,
} from "./StatusConstants";

export interface OfficialAssignment {
  official_id: EntityId;
  role_id: EntityId;
}

export interface FixtureDetailsSetup extends BaseEntity {
  organization_id: EntityId;
  fixture_id: EntityId;
  home_team_jersey_id: EntityId;
  away_team_jersey_id: EntityId;
  official_jersey_id: EntityId;
  assigned_officials: OfficialAssignment[];
  assignment_notes: string;
  confirmation_status: FixtureDetailsSetupConfirmationStatus;
  status: EntityStatus;
}

export type FixtureDetailsSetupConfirmationStatus = ConfirmationStatusValue;

export type CreateFixtureDetailsSetupInput = Omit<
  ScalarInput<FixtureDetailsSetup>,
  "id" | "created_at" | "updated_at"
>;

export type UpdateFixtureDetailsSetupInput = Partial<
  Omit<
    ScalarInput<FixtureDetailsSetup>,
    "id" | "created_at" | "updated_at" | "fixture_id"
  >
>;

export function create_empty_official_assignment(): ScalarInput<OfficialAssignment> {
  return {
    official_id: "",
    role_id: "",
  };
}

export function create_empty_fixture_details_setup_input(
  organization_id: CreateFixtureDetailsSetupInput["organization_id"] = "",
  fixture_id: CreateFixtureDetailsSetupInput["fixture_id"] = "",
): CreateFixtureDetailsSetupInput {
  return {
    organization_id,
    fixture_id,
    home_team_jersey_id: "",
    away_team_jersey_id: "",
    official_jersey_id: "",
    assigned_officials: [create_empty_official_assignment()],
    assignment_notes: "",
    confirmation_status: CONFIRMATION_STATUS.PENDING,
    status: ENTITY_STATUS.ACTIVE,
  };
}

export { validate_fixture_details_setup_input } from "./FixtureDetailsSetupValidation";

interface OfficialTeamConflict {
  official_id: EntityId;
  official_name: string;
  team_id: EntityId;
  team_name: Name;
  association_type: OfficialTeamAssociationType;
  message: string;
}

export interface OfficialWithAssociations {
  id: EntityId;
  first_name: Name;
  last_name: Name;
  associated_team_ids: EntityId[];
  association_details: {
    team_id: EntityId;
    association_type: OfficialTeamAssociationType;
  }[];
}

export function detect_official_team_conflicts(
  assigned_officials: OfficialAssignment[],
  officials_with_associations: OfficialWithAssociations[],
  home_team_id: EntityId,
  away_team_id: EntityId,
  home_team_name: Name,
  away_team_name: Name,
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

const ASSOCIATION_CONFLICT_LABELS: Readonly<
  Record<OfficialTeamAssociationType, string>
> = {
  current_member: "current membership",
  former_member: "former membership",
  family_connection: "family connection",
  financial_interest: "financial interest",
  other: "connection",
};

function format_association_type_for_display(
  association_type: OfficialTeamAssociationType,
): string {
  return ASSOCIATION_CONFLICT_LABELS[association_type];
}
