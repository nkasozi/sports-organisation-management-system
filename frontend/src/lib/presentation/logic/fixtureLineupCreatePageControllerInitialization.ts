import { get } from "svelte/store";

import { get_authorization_preselect_values } from "$lib/core/interfaces/ports";
import { determine_initial_wizard_step } from "$lib/core/services/fixtureLineupWizard";
import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";
import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";
import { access_denial_store } from "$lib/presentation/stores/accessDenial";
import { auth_store } from "$lib/presentation/stores/auth";

import {
  type FixtureLineupCreateDependencies,
  type FixtureLineupCreateReferenceData,
  load_fixture_lineup_create_reference_data,
} from "./fixtureLineupCreateData";
import { FIXTURE_LINEUP_CREATE_INITIALIZATION_KIND } from "./fixtureLineupCreateInitializationKind";
import type { FixtureLineupCreateAuthProfileState } from "./fixtureLineupCreatePageContracts";

const KIND = FIXTURE_LINEUP_CREATE_INITIALIZATION_KIND;

const CREATE_ACCESS_STATUS = {
  ALLOWED: "allowed",
  DENIED: "denied",
  CHECK_FAILED: "check_failed",
} as const;

type CreateAccessStatus =
  (typeof CREATE_ACCESS_STATUS)[keyof typeof CREATE_ACCESS_STATUS];

const FIXTURE_LINEUP_CREATE_PATH = "/fixture-lineups/create";
const HOME_PATH = "/";
const FIXTURE_LINEUP_CREATE_ACCESS_DENIED_MESSAGE =
  "Access denied: Your role does not have permission to create fixture lineups. Please contact your organization administrator if you believe this is an error.";
export const FIXTURE_LINEUP_CREATE_ACCESS_CHECK_FAILED_MESSAGE =
  "We couldn't confirm your permission to create lineups. Please refresh the page and try again.";

type FixtureLineupCreateInitializationResult =
  | { kind: typeof KIND.SKIP }
  | { kind: typeof KIND.AUTH_FAILED; error_message: string }
  | { kind: typeof KIND.REDIRECT; redirect_to: string }
  | {
      kind: typeof KIND.LOADED;
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

async function check_fixture_lineup_create_access(): Promise<CreateAccessStatus> {
  const auth_state = get(auth_store);
  if (auth_state.current_token.status !== PRESENCE_STATUS.PRESENT)
    return CREATE_ACCESS_STATUS.ALLOWED;
  const authorization_result =
    await get_authorization_adapter().check_entity_authorized(
      auth_state.current_token.token.raw_token,
      "fixturelineup",
      "create",
    );
  if (!authorization_result.success) {
    console.error("[FixtureLineupCreate] Access check failed", {
      event: "fixture_lineup_create_access_check_failed",
      error: authorization_result.error,
    });
    return CREATE_ACCESS_STATUS.CHECK_FAILED;
  }
  return authorization_result.data.is_authorized
    ? CREATE_ACCESS_STATUS.ALLOWED
    : CREATE_ACCESS_STATUS.DENIED;
}

function build_access_blocked_result(
  access_status: CreateAccessStatus,
): FixtureLineupCreateInitializationResult {
  if (access_status === CREATE_ACCESS_STATUS.CHECK_FAILED)
    return {
      kind: KIND.AUTH_FAILED,
      error_message: FIXTURE_LINEUP_CREATE_ACCESS_CHECK_FAILED_MESSAGE,
    };
  access_denial_store.set_denial(
    FIXTURE_LINEUP_CREATE_PATH,
    FIXTURE_LINEUP_CREATE_ACCESS_DENIED_MESSAGE,
  );
  return { kind: KIND.REDIRECT, redirect_to: HOME_PATH };
}

export async function initialize_fixture_lineup_create_page(
  params: InitializeFixtureLineupCreatePageParams,
): Promise<FixtureLineupCreateInitializationResult> {
  if (!params.is_browser) return { kind: KIND.SKIP };
  const auth_result = await ensure_auth_profile();
  if (!auth_result.success)
    return { kind: KIND.AUTH_FAILED, error_message: auth_result.error_message };
  const access_status = await check_fixture_lineup_create_access();
  if (access_status !== CREATE_ACCESS_STATUS.ALLOWED)
    return build_access_blocked_result(access_status);
  const preselect_values =
    params.current_auth_profile_state.status === PRESENCE_STATUS.PRESENT
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
    kind: KIND.LOADED,
    reference_data,
    current_step_index: determine_initial_wizard_step({
      organization_is_restricted: params.organization_is_restricted,
      organization_id:
        preselect_values.organization_id || params.form_organization_id,
      has_selected_organization:
        reference_data.selected_organization_state.status ===
        PRESENCE_STATUS.PRESENT,
    }),
  };
}
