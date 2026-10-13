import type {
  AuthorizationPort,
  UserScopeProfile,
} from "$lib/core/interfaces/ports";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";
import type { AuthState } from "$lib/presentation/stores/authTypes";

type CompetitionEditCurrentProfileState =
  | { status: "missing" }
  | { status: "present"; profile: UserScopeProfile };

type CompetitionEditRawTokenState =
  | { status: "missing" }
  | { status: "present"; raw_token: string };

type CompetitionEditAuthorizationOutcome =
  | { status: "halted" }
  | {
      status: "proceed";
      can_edit_competition: boolean;
      permission_info_message: string;
    };

const COMPETITION_EDIT_VIEW_ONLY_MESSAGE =
  "You have view-only access to this competition. Editing is not available.";

export function build_competition_edit_current_profile_state(
  auth_state: AuthState,
): CompetitionEditCurrentProfileState {
  const current_profile_state = auth_state.current_profile;

  if (current_profile_state.status !== PRESENCE_STATUS.PRESENT) {
    return { status: "missing" };
  }

  return {
    status: "present",
    profile: current_profile_state.profile as unknown as UserScopeProfile,
  };
}

export function build_competition_edit_raw_token_state(
  auth_state: AuthState,
): CompetitionEditRawTokenState {
  const current_token_state = auth_state.current_token;

  if (current_token_state.status !== PRESENCE_STATUS.PRESENT) {
    return { status: "missing" };
  }

  return {
    status: "present",
    raw_token: current_token_state.token.raw_token,
  };
}

function build_competition_edit_proceed_outcome(
  can_edit_competition: boolean,
  permission_info_message: string,
): CompetitionEditAuthorizationOutcome {
  return { status: "proceed", can_edit_competition, permission_info_message };
}

type CompetitionEditAuthorizationCommand = {
  raw_token_state: CompetitionEditRawTokenState;
  get_authorization_adapter: () => Pick<
    AuthorizationPort,
    "check_entity_authorized"
  >;
  deny_access: () => void;
};

async function is_competition_read_authorized(
  command: CompetitionEditAuthorizationCommand,
  raw_token: string,
): Promise<boolean> {
  const read_auth_check = await command
    .get_authorization_adapter()
    .check_entity_authorized(raw_token, "competition", "read");
  if (!read_auth_check.success) {
    console.warn(
      "[CompetitionEditAuthorization] Read authorization check failed",
      {
        event: "competition_edit_read_authorization_check_failed",
        error: read_auth_check.error,
      },
    );
    return false;
  }
  if (read_auth_check.data.is_authorized) return true;
  console.warn("[CompetitionEditAuthorization] Read access denied", {
    event: "competition_edit_read_access_denied",
  });
  command.deny_access();
  return false;
}

export async function authorize_competition_edit_page(
  command: CompetitionEditAuthorizationCommand,
): Promise<CompetitionEditAuthorizationOutcome> {
  const raw_token_state = command.raw_token_state;
  if (raw_token_state.status !== PRESENCE_STATUS.PRESENT) {
    return build_competition_edit_proceed_outcome(false, "");
  }
  if (
    !(await is_competition_read_authorized(command, raw_token_state.raw_token))
  )
    return { status: "halted" };
  const update_auth_check = await command
    .get_authorization_adapter()
    .check_entity_authorized(
      raw_token_state.raw_token,
      "competition",
      "update",
    );
  const can_edit_competition =
    update_auth_check.success && update_auth_check.data.is_authorized;
  return build_competition_edit_proceed_outcome(
    can_edit_competition,
    can_edit_competition ? "" : COMPETITION_EDIT_VIEW_ONLY_MESSAGE,
  );
}
