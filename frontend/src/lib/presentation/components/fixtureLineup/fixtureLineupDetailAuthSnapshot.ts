import type {
  FixtureLineupDetailProfileState,
  FixtureLineupDetailTokenState,
} from "$lib/presentation/logic/fixtureLineupDetailPageContracts";
import { build_fixture_lineup_detail_profile_state } from "$lib/presentation/logic/fixtureLineupDetailPageData";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";
import type { AuthState } from "$lib/presentation/stores/auth";

type FixtureLineupDetailCurrentProfileState =
  | { status: typeof PRESENCE_STATUS.MISSING }
  | {
      status: typeof PRESENCE_STATUS.PRESENT;
      profile: { organization_id: string };
    };

interface FixtureLineupDetailAuthSnapshot {
  current_profile_state: FixtureLineupDetailProfileState;
  current_token_state: FixtureLineupDetailTokenState;
}

function build_token_state(
  current_token: AuthState["current_token"],
): FixtureLineupDetailTokenState {
  if (current_token.status !== PRESENCE_STATUS.PRESENT) {
    return { status: PRESENCE_STATUS.MISSING };
  }
  return {
    status: PRESENCE_STATUS.PRESENT,
    raw_token: current_token.token.raw_token,
  };
}

function build_current_profile_state(
  current_profile: AuthState["current_profile"],
): FixtureLineupDetailCurrentProfileState {
  if (current_profile.status !== PRESENCE_STATUS.PRESENT) {
    return { status: PRESENCE_STATUS.MISSING };
  }
  return {
    status: PRESENCE_STATUS.PRESENT,
    profile: { organization_id: current_profile.profile.organization_id },
  };
}

export function build_fixture_lineup_detail_auth_snapshot(
  auth_state: AuthState,
): FixtureLineupDetailAuthSnapshot {
  return {
    current_profile_state: build_fixture_lineup_detail_profile_state(
      build_current_profile_state(auth_state.current_profile),
    ),
    current_token_state: build_token_state(auth_state.current_token),
  };
}
