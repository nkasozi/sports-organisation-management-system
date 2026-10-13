import type {
  OfficialAssignment,
  OfficialWithAssociations,
} from "../../core/entities/FixtureDetailsSetup";
import { ENTITY_STATUS } from "../../core/entities/StatusConstants";
import { is_object_value } from "./runtimeTypeGuards";

const UNKNOWN_OFFICIAL_NAME = "Unknown Official";

export type ReadByIdUseCases = {
  get_by_id: (id: string) => Promise<{ success: boolean; data?: unknown }>;
};

type ListByOfficialUseCases = {
  list_by_official: (
    official_id: string,
  ) => Promise<{ success: boolean; data?: unknown }>;
};

export type DynamicEntityFormConflictDependencies = {
  fixture_use_cases: ReadByIdUseCases;
  team_use_cases: ReadByIdUseCases;
  official_use_cases: ReadByIdUseCases;
  official_associated_team_use_cases: ListByOfficialUseCases;
};

export async function build_officials_with_associations(
  assigned_officials: OfficialAssignment[],
  dependencies: DynamicEntityFormConflictDependencies,
): Promise<OfficialWithAssociations[]> {
  const officials_with_associations: OfficialWithAssociations[] = [];
  for (const assignment of assigned_officials) {
    if (!assignment.official_id) continue;
    officials_with_associations.push(
      await build_official_with_associations(assignment, dependencies),
    );
  }
  return officials_with_associations;
}

type OfficialAssociationRecord = {
  status: string;
  team_id: string;
  association_type: string;
};

function read_official_associations(associations_result: {
  success: boolean;
  data?: unknown;
}): OfficialAssociationRecord[] {
  if (!associations_result.success) return [];
  const associations_data = associations_result.data;
  if (Array.isArray(associations_data))
    return associations_data as OfficialAssociationRecord[];
  const items = is_object_value(associations_data)
    ? (associations_data as { items?: unknown }).items
    : void 0;
  return Array.isArray(items) ? (items as OfficialAssociationRecord[]) : [];
}

async function build_official_with_associations(
  assignment: OfficialAssignment,
  dependencies: DynamicEntityFormConflictDependencies,
): Promise<OfficialWithAssociations> {
  const associations_result =
    await dependencies.official_associated_team_use_cases.list_by_official(
      assignment.official_id,
    );
  const official_name = await load_official_name(
    assignment.official_id,
    dependencies.official_use_cases,
  );
  const associated_team_ids: string[] = [];
  const association_details: { team_id: string; association_type: string }[] =
    [];
  const associations_list = read_official_associations(associations_result);

  for (const association of associations_list) {
    if (association.status !== ENTITY_STATUS.ACTIVE) continue;
    associated_team_ids.push(association.team_id);
    association_details.push({
      team_id: association.team_id,
      association_type: association.association_type,
    });
  }

  const [first_name, ...last_name_parts] = official_name.split(" ");
  return {
    id: assignment.official_id,
    first_name: first_name || "",
    last_name: last_name_parts.join(" ") || "",
    associated_team_ids,
    association_details,
  } as unknown as OfficialWithAssociations;
}

async function load_official_name(
  official_id: string,
  official_use_cases: ReadByIdUseCases,
): Promise<string> {
  const official_result = await official_use_cases.get_by_id(official_id);
  if (!official_result.success || !official_result.data)
    return UNKNOWN_OFFICIAL_NAME;
  const official = official_result.data as {
    first_name?: string;
    last_name?: string;
  };
  return (
    `${official.first_name || ""} ${official.last_name || ""}`.trim() ||
    UNKNOWN_OFFICIAL_NAME
  );
}
