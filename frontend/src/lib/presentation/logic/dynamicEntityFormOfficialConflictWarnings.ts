import {
  detect_official_team_conflicts,
  type OfficialAssignment,
  type OfficialWithAssociations,
} from "../../core/entities/FixtureDetailsSetup";
import type { EntityId, Name } from "../../core/types/DomainScalars";

type ReadByIdUseCases = {
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
  official_use_cases?: ReadByIdUseCases;
  official_associated_team_use_cases: ListByOfficialUseCases;
};

export async function load_dynamic_form_official_conflict_warnings(
  entity_type: string,
  form_data: Record<string, any>,
  dependencies: DynamicEntityFormConflictDependencies,
): Promise<string[]> {
  if (entity_type.toLowerCase() !== "fixturedetailssetup") {
    return [];
  }

  const fixture_id = form_data["fixture_id"];
  const assigned_officials = form_data["assigned_officials"] as
    | OfficialAssignment[]
    | undefined;
  if (!fixture_id || !assigned_officials || assigned_officials.length === 0) {
    return [];
  }

  const fixture_result =
    await dependencies.fixture_use_cases.get_by_id(fixture_id);
  if (!fixture_result.success || !fixture_result.data) {
    return [];
  }

  const fixture = fixture_result.data as {
    home_team_id?: string;
    away_team_id?: string;
  };
  const [home_team_result, away_team_result] = await Promise.all([
    dependencies.team_use_cases.get_by_id(fixture.home_team_id ?? ""),
    dependencies.team_use_cases.get_by_id(fixture.away_team_id ?? ""),
  ]);
  const home_team_name = home_team_result.success
    ? ((home_team_result.data as { name?: string } | undefined)?.name ??
      "Home Team")
    : "Home Team";
  const away_team_name = away_team_result.success
    ? ((away_team_result.data as { name?: string } | undefined)?.name ??
      "Away Team")
    : "Away Team";

  const officials_with_associations: OfficialWithAssociations[] = [];
  for (const assignment of assigned_officials) {
    if (!assignment.official_id) continue;
    officials_with_associations.push(
      await build_official_with_associations(assignment, dependencies),
    );
  }

  return detect_official_team_conflicts(
    assigned_officials,
    officials_with_associations,
    (fixture.home_team_id ?? "") as unknown as EntityId,
    (fixture.away_team_id ?? "") as unknown as EntityId,
    home_team_name as unknown as Name,
    away_team_name as unknown as Name,
  ).map((warning) => warning.message);
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
  const associations_data = associations_result.success
    ? (associations_result.data as any)
    : void 0;
  const associations_list = Array.isArray(associations_data)
    ? associations_data
    : associations_data?.items || [];

  for (const association of associations_list) {
    if (association.status !== "active") continue;
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
  official_use_cases?: ReadByIdUseCases,
): Promise<string> {
  if (!official_use_cases) return "Unknown Official";
  const official_result = await official_use_cases.get_by_id(official_id);
  if (!official_result.success || !official_result.data)
    return "Unknown Official";
  const official = official_result.data as {
    first_name?: string;
    last_name?: string;
  };
  return (
    `${official.first_name || ""} ${official.last_name || ""}`.trim() ||
    "Unknown Official"
  );
}
