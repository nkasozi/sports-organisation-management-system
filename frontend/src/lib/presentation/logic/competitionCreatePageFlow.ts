import type { CompetitionFormat } from "$lib/core/entities/CompetitionFormat";
import type { Organization } from "$lib/core/entities/Organization";
import type { Sport } from "$lib/core/entities/Sport";
import type { UserScopeProfile } from "$lib/core/interfaces/ports";
import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";
import type { SelectOption } from "$lib/presentation/components/ui/SelectField.svelte";
import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";

import type { CompetitionCreatePageDependencies } from "./competitionCreatePageData";
import {
  load_competition_create_formats,
  load_competition_create_organizations,
  load_competition_create_sport,
  load_competition_create_team_options,
} from "./competitionCreatePageData";

export async function initialize_competition_create_page(command: {
  current_auth_profile: UserScopeProfile | null;
  dependencies: CompetitionCreatePageDependencies;
  is_organization_restricted: boolean;
  raw_token: string | null;
}): Promise<{
  access_denied: boolean;
  error_message: string;
  organization_options: SelectOption[];
  organizations: Organization[];
  preselected_organization_id: string;
}> {
  const auth_result = await ensure_auth_profile();
  if (!auth_result.success) {
    return {
      access_denied: false,
      error_message: auth_result.error_message,
      organization_options: [],
      organizations: [],
      preselected_organization_id: "",
    };
  }

  if (command.raw_token) {
    const authorization_check =
      await get_authorization_adapter().check_entity_authorized(
        command.raw_token,
        "competition",
        "create",
      );
    if (
      authorization_check.success &&
      !authorization_check.data.is_authorized
    ) {
      return {
        access_denied: true,
        error_message: "",
        organization_options: [],
        organizations: [],
        preselected_organization_id: "",
      };
    }
  }

  const organizations_result = await load_competition_create_organizations({
    current_auth_profile: command.current_auth_profile,
    dependencies: command.dependencies,
    is_organization_restricted: command.is_organization_restricted,
  });
  return {
    access_denied: false,
    error_message: "",
    organization_options: organizations_result.organization_options,
    organizations: organizations_result.organizations,
    preselected_organization_id:
      organizations_result.preselected_organization_id,
  };
}

export async function load_competition_create_organization_state(command: {
  dependencies: CompetitionCreatePageDependencies;
  organization_id: string;
  organizations: Organization[];
}): Promise<{
  competition_format_options: SelectOption[];
  competition_formats: CompetitionFormat[];
  selected_sport: Sport | null;
  team_options: SelectOption[];
}> {
  const [team_options, formats_result, selected_sport] = await Promise.all([
    load_competition_create_team_options(
      command.organization_id,
      command.dependencies,
    ),
    load_competition_create_formats(
      command.organization_id,
      command.dependencies,
    ),
    load_competition_create_sport(
      command.organization_id,
      command.organizations,
    ),
  ]);
  return {
    team_options,
    competition_formats: formats_result.competition_formats,
    competition_format_options: formats_result.competition_format_options,
    selected_sport,
  };
}
