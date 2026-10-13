import {
  detect_official_team_conflicts,
  type OfficialAssignment,
} from "../../core/entities/FixtureDetailsSetup";
import type { EntityId, Name } from "../../core/types/DomainScalars";
import {
  build_officials_with_associations,
  type DynamicEntityFormConflictDependencies,
  type ReadByIdUseCases,
} from "./dynamicEntityFormOfficialAssociations";
import {
  DYNAMIC_FORM_ENTITY_TYPE,
  DYNAMIC_FORM_FIELD_NAME,
  DYNAMIC_FORM_TEAM_LABEL,
  type DynamicFormData,
  is_dynamic_form_entity_type,
} from "./dynamicFormConstants";
import { read_dynamic_form_text_value } from "./dynamicFormDataAccess";

export type { DynamicEntityFormConflictDependencies } from "./dynamicEntityFormOfficialAssociations";

type FixtureTeamIds = {
  home_team_id?: string;
  away_team_id?: string;
};

type FixtureTeamNames = {
  home_team_name: string;
  away_team_name: string;
};

function read_team_name(
  team_result: { success: boolean; data?: unknown },
  default_name: string,
): string {
  return team_result.success
    ? ((team_result.data as { name?: string } | undefined)?.name ??
        default_name)
    : default_name;
}

async function load_fixture_team_names(
  fixture: FixtureTeamIds,
  team_use_cases: ReadByIdUseCases,
): Promise<FixtureTeamNames> {
  const [home_team_result, away_team_result] = await Promise.all([
    team_use_cases.get_by_id(fixture.home_team_id ?? ""),
    team_use_cases.get_by_id(fixture.away_team_id ?? ""),
  ]);
  return {
    home_team_name: read_team_name(
      home_team_result,
      DYNAMIC_FORM_TEAM_LABEL.HOME,
    ),
    away_team_name: read_team_name(
      away_team_result,
      DYNAMIC_FORM_TEAM_LABEL.AWAY,
    ),
  };
}

function is_fixture_details_setup(entity_type: string): boolean {
  return is_dynamic_form_entity_type(
    entity_type,
    DYNAMIC_FORM_ENTITY_TYPE.FIXTURE_DETAILS_SETUP,
  );
}

function read_assigned_officials(
  form_data: DynamicFormData,
): OfficialAssignment[] {
  const assigned_officials_value =
    form_data[DYNAMIC_FORM_FIELD_NAME.ASSIGNED_OFFICIALS];
  return Array.isArray(assigned_officials_value)
    ? (assigned_officials_value as OfficialAssignment[])
    : [];
}

export async function load_dynamic_form_official_conflict_warnings(
  entity_type: string,
  form_data: DynamicFormData,
  dependencies: DynamicEntityFormConflictDependencies,
): Promise<string[]> {
  if (!is_fixture_details_setup(entity_type)) return [];
  const fixture_id = read_dynamic_form_text_value(
    form_data,
    DYNAMIC_FORM_FIELD_NAME.FIXTURE_ID,
  );
  const assigned_officials = read_assigned_officials(form_data);
  if (!fixture_id || assigned_officials.length === 0) return [];
  const fixture_result =
    await dependencies.fixture_use_cases.get_by_id(fixture_id);
  if (!fixture_result.success || !fixture_result.data) return [];
  const fixture = fixture_result.data as FixtureTeamIds;
  const team_names = await load_fixture_team_names(
    fixture,
    dependencies.team_use_cases,
  );
  const officials_with_associations = await build_officials_with_associations(
    assigned_officials,
    dependencies,
  );
  return detect_official_team_conflicts(
    assigned_officials,
    officials_with_associations,
    (fixture.home_team_id ?? "") as unknown as EntityId,
    (fixture.away_team_id ?? "") as unknown as EntityId,
    team_names.home_team_name as unknown as Name,
    team_names.away_team_name as unknown as Name,
  ).map((warning) => warning.message);
}
