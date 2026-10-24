import { is_scope_restricted } from "$lib/core/interfaces/ports";
import type { CompetitionCreatePageControllerCommand } from "$lib/presentation/logic/competitionCreatePageControllerCommand";
import { competition_create_dependencies } from "$lib/presentation/logic/competitionCreatePageControllerDependencies";
import { load_competition_create_organization_state } from "$lib/presentation/logic/competitionCreatePageFlow";
import { build_sport_rule_overrides } from "$lib/presentation/logic/competitionSportScoringDefaults";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

export function is_organization_restricted(
  command: CompetitionCreatePageControllerCommand,
): boolean {
  const current_auth_profile_state = command.get_current_auth_profile_state();

  if (current_auth_profile_state.status === PRESENCE_STATUS.MISSING) {
    return false;
  }

  return is_scope_restricted(
    current_auth_profile_state.profile,
    "organization_id",
  );
}

function reset_organization_dependent_state(
  command: CompetitionCreatePageControllerCommand,
): void {
  command.set_selected_team_ids(new Set());
  command.set_selected_format_state({ status: "missing" });
  command.set_selected_sport_state({ status: "missing" });
  command.set_form_data({
    ...command.get_form_data(),
    competition_format_id: "",
    rule_overrides: {},
  });
  command.set_is_loading_teams(true);
  command.set_is_loading_formats(true);
}

export async function trigger_organization_side_effects(
  command: CompetitionCreatePageControllerCommand,
  organization_id: string,
): Promise<void> {
  reset_organization_dependent_state(command);
  const organization_state = await load_competition_create_organization_state({
    dependencies: competition_create_dependencies,
    organization_id,
    organizations: command.get_organizations(),
  });
  command.set_team_options(organization_state.team_options);
  command.set_competition_formats(organization_state.competition_formats);
  command.set_competition_format_options(
    organization_state.competition_format_options,
  );
  command.set_selected_sport_state(organization_state.selected_sport_state);
  command.set_form_data({
    ...command.get_form_data(),
    rule_overrides: build_sport_rule_overrides(
      organization_state.selected_sport_state,
    ),
  });
  command.set_is_loading_teams(false);
  command.set_is_loading_formats(false);
}
