import type { CreateCompetitionInput } from "$lib/core/entities/Competition";
import type { CompetitionFormat } from "$lib/core/entities/CompetitionFormat";
import type { Organization } from "$lib/core/entities/Organization";
import { is_scope_restricted } from "$lib/core/interfaces/ports";
import type { SelectOption } from "$lib/presentation/components/ui/SelectField.svelte";
import {
  competition_create_dependencies,
  COMPETITION_CREATE_PAGE_TEXT,
} from "$lib/presentation/logic/competitionCreatePageControllerDependencies";
import type { CompetitionCreateProfileState } from "$lib/presentation/logic/competitionCreatePageData";
import {
  type CompetitionCreateRawTokenState,
  type CompetitionCreateSelectedSportState,
  initialize_competition_create_page,
  load_competition_create_organization_state,
} from "$lib/presentation/logic/competitionCreatePageFlow";
import {
  type CompetitionCreateSelectedFormatState,
  get_next_selected_team_ids,
  update_competition_auto_squad_submission,
} from "$lib/presentation/logic/competitionCreatePageState";
import { submit_competition_create_form } from "$lib/presentation/logic/competitionCreatePageSubmit";
import { access_denial_store } from "$lib/presentation/stores/accessDenial";

export function create_competition_create_page_controller_runtime(command: {
  get_competition_formats: () => CompetitionFormat[];
  get_current_auth_profile_state: () => CompetitionCreateProfileState;
  get_current_raw_token_state: () => CompetitionCreateRawTokenState;
  get_form_data: () => CreateCompetitionInput;
  get_selected_format_state: () => CompetitionCreateSelectedFormatState;
  get_selected_team_ids: () => Set<string>;
  get_is_team_count_valid: () => boolean;
  get_organizations: () => Organization[];
  is_browser: boolean;
  goto: (path: string) => Promise<unknown>;
  set_competition_format_options: (value: SelectOption[]) => void;
  set_competition_formats: (value: CompetitionFormat[]) => void;
  set_error_message: (value: string) => void;
  set_form_data: (value: CreateCompetitionInput) => void;
  set_is_loading_formats: (value: boolean) => void;
  set_is_loading_organizations: (value: boolean) => void;
  set_is_loading_teams: (value: boolean) => void;
  set_is_saving: (value: boolean) => void;
  set_organization_options: (value: SelectOption[]) => void;
  set_organizations: (value: Organization[]) => void;
  set_selected_format_state: (
    value: CompetitionCreateSelectedFormatState,
  ) => void;
  set_selected_sport_state: (
    value: CompetitionCreateSelectedSportState,
  ) => void;
  set_selected_team_ids: (value: Set<string>) => void;
  set_team_options: (value: SelectOption[]) => void;
  show_toast: (message: string, type: "success" | "error" | "info") => void;
}): {
  handle_auto_squad_submission_toggle: (enabled: boolean) => void;
  handle_format_change: (event: CustomEvent<{ value: string }>) => void;
  handle_organization_change: (
    event: CustomEvent<{ value: string }>,
  ) => Promise<void>;
  handle_submit: () => Promise<void>;
  handle_team_toggle: (team_id: string) => boolean;
  initialize: () => Promise<void>;
} {
  const is_organization_restricted = (): boolean => {
    const current_auth_profile_state = command.get_current_auth_profile_state();

    if (current_auth_profile_state.status === "missing") {
      return false;
    }

    return is_scope_restricted(
      current_auth_profile_state.profile,
      "organization_id",
    );
  };
  const trigger_organization_side_effects = async (
    organization_id: string,
  ): Promise<void> => {
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
    const organization_state = await load_competition_create_organization_state(
      {
        dependencies: competition_create_dependencies,
        organization_id,
        organizations: command.get_organizations(),
      },
    );
    command.set_team_options(organization_state.team_options);
    command.set_competition_formats(organization_state.competition_formats);
    command.set_competition_format_options(
      organization_state.competition_format_options,
    );
    command.set_selected_sport_state(organization_state.selected_sport_state);
    command.set_is_loading_teams(false);
    command.set_is_loading_formats(false);
  };
  return {
    handle_auto_squad_submission_toggle: (enabled: boolean): void => {
      command.set_form_data(
        update_competition_auto_squad_submission(
          command.get_form_data(),
          enabled,
        ),
      );
    },
    handle_format_change: (event: CustomEvent<{ value: string }>): void => {
      command.set_form_data({
        ...command.get_form_data(),
        competition_format_id: event.detail.value,
      });
      const selected_format = command
        .get_competition_formats()
        .find(
          (competition_format: CompetitionFormat) =>
            competition_format.id === event.detail.value,
        );

      command.set_selected_format_state(
        selected_format
          ? { status: "present", competition_format: selected_format }
          : { status: "missing" },
      );
    },
    handle_organization_change: async (
      event: CustomEvent<{ value: string }>,
    ): Promise<void> => {
      command.set_form_data({
        ...command.get_form_data(),
        organization_id: event.detail.value,
      });
      await trigger_organization_side_effects(event.detail.value);
    },
    handle_submit: async (): Promise<void> => {
      if (!command.get_is_team_count_valid()) {
        const selected_format_state = command.get_selected_format_state();
        command.show_toast(
          selected_format_state.status === "present"
            ? `Please select between ${selected_format_state.competition_format.min_teams_required} and ${selected_format_state.competition_format.max_teams_allowed} teams`
            : "Please select valid teams for the chosen competition format",
          "error",
        );
        return;
      }
      command.set_is_saving(true);
      const submit_result = await submit_competition_create_form({
        dependencies: competition_create_dependencies,
        form_data: command.get_form_data(),
      });
      command.set_is_saving(false);
      if (!submit_result.success) {
        command.show_toast(submit_result.error_message, "error");
        return;
      }
      command.show_toast(COMPETITION_CREATE_PAGE_TEXT.created, "success");
      setTimeout(() => {
        void command.goto("/competitions");
      }, 1500);
    },
    handle_team_toggle: (team_id: string): boolean => {
      command.set_selected_team_ids(
        get_next_selected_team_ids(command.get_selected_team_ids(), team_id),
      );
      return true;
    },
    initialize: async (): Promise<void> => {
      if (!command.is_browser) {
        return;
      }
      const page_result = await initialize_competition_create_page({
        current_auth_profile_state: command.get_current_auth_profile_state(),
        dependencies: competition_create_dependencies,
        is_organization_restricted: is_organization_restricted(),
        raw_token_state: command.get_current_raw_token_state(),
      });
      if (page_result.access_denied) {
        access_denial_store.set_denial(
          COMPETITION_CREATE_PAGE_TEXT.create_path,
          COMPETITION_CREATE_PAGE_TEXT.access_denied,
        );
        await command.goto("/competitions");
        return;
      }
      if (page_result.error_message) {
        command.set_error_message(page_result.error_message);
        command.set_is_loading_organizations(false);
        command.set_is_loading_formats(false);
        command.set_is_loading_teams(false);
        return;
      }
      command.set_organizations(page_result.organizations);
      command.set_organization_options(page_result.organization_options);
      command.set_is_loading_organizations(false);
      if (!page_result.preselected_organization_id) {
        command.set_is_loading_formats(false);
        return;
      }
      command.set_form_data({
        ...command.get_form_data(),
        organization_id: page_result.preselected_organization_id,
      });
      await trigger_organization_side_effects(
        page_result.preselected_organization_id,
      );
    },
  };
}
