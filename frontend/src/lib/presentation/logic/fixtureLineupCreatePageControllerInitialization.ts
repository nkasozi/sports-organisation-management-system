import { get } from "svelte/store";

import { get_authorization_preselect_values } from "$lib/core/interfaces/ports";
import { determine_initial_wizard_step } from "$lib/core/services/fixtureLineupWizard";
import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";
import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
import { access_denial_store } from "$lib/presentation/stores/accessDenial";
import { auth_store } from "$lib/presentation/stores/auth";

import {
  type FixtureLineupCreateDependencies,
  type FixtureLineupCreateReferenceData,
  load_fixture_lineup_create_reference_data,
} from "./fixtureLineupCreateData";
import type { FixtureLineupCreateAuthProfileState } from "./fixtureLineupCreatePageContracts";

type FixtureLineupCreateInitializationResult =
  | { kind: "skip" }
  | { kind: "auth-failed"; error_message: string }
  | { kind: "redirect"; redirect_to: string }
  | {
      kind: "loaded";
      reference_data: FixtureLineupCreateReferenceData;
      current_step_index: number;
    };

interface InitializeFixtureLineupCreatePageParams {
  is_browser: boolean;
  current_auth_profile_state: FixtureLineupCreateAuthProfileState;
  form_organization_id: string;
  organization_is_restricted: boolean;
  dependencies: FixtureLineupCreateDependencies;
}

export async function initialize_fixture_lineup_create_page(
  params: InitializeFixtureLineupCreatePageParams,
): Promise<FixtureLineupCreateInitializationResult> {
  if (!params.is_browser) return { kind: "skip" };
  const auth_result = await ensure_auth_profile();
  if (!auth_result.success)
    return { kind: "auth-failed", error_message: auth_result.error_message };
  const auth_state = get(auth_store);
  if (auth_state.current_token.status === "present") {
    const authorization_result =
      await get_authorization_adapter().check_entity_authorized(
        auth_state.current_token.token.raw_token,
        "fixturelineup",
        "create",
      );
    if (
      authorization_result.success &&
      !authorization_result.data.is_authorized
    ) {
      access_denial_store.set_denial(
        "/fixture-lineups/create",
        "Access denied: Your role does not have permission to create fixture lineups. Please contact your organization administrator if you believe this is an error.",
      );
      return { kind: "redirect", redirect_to: "/" };
    }
  }
  const preselect_values =
    params.current_auth_profile_state.status === "present"
      ? get_authorization_preselect_values(
          params.current_auth_profile_state.profile,
        )
      : {};
  const reference_data = await load_fixture_lineup_create_reference_data(
    params.current_auth_profile_state,
    params.form_organization_id,
    params.dependencies,
  );
  return {
    kind: "loaded",
    reference_data,
    current_step_index: determine_initial_wizard_step({
      organization_is_restricted: params.organization_is_restricted,
      organization_id:
        preselect_values.organization_id || params.form_organization_id,
      has_selected_organization:
        reference_data.selected_organization_state.status === "present",
    }),
  };
}
