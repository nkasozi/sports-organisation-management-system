import { get } from "svelte/store";

import type { OfficialAssociatedTeamUseCases } from "../../core/usecases/OfficialAssociatedTeamUseCases";
import { create_official_associated_team_use_cases } from "../../core/usecases/OfficialAssociatedTeamUseCases";
import type { OfficialPerformanceRatingUseCases } from "../../core/usecases/OfficialPerformanceRatingUseCases";
import { create_official_performance_rating_use_cases } from "../../core/usecases/OfficialPerformanceRatingUseCases";
import type { OfficialUseCases } from "../../core/usecases/OfficialUseCases";
import { create_official_use_cases } from "../../core/usecases/OfficialUseCases";
import type { PlayerPositionUseCases } from "../../core/usecases/PlayerPositionUseCases";
import { create_player_position_use_cases } from "../../core/usecases/PlayerPositionUseCases";
import type { PlayerProfileUseCases } from "../../core/usecases/PlayerProfileUseCases";
import { create_player_profile_use_cases } from "../../core/usecases/PlayerProfileUseCases";
import type { PlayerTeamMembershipUseCases } from "../../core/usecases/PlayerTeamMembershipUseCases";
import { create_player_team_membership_use_cases } from "../../core/usecases/PlayerTeamMembershipUseCases";
import type { PlayerTeamTransferHistoryUseCases } from "../../core/usecases/PlayerTeamTransferHistoryUseCases";
import { create_player_team_transfer_history_use_cases } from "../../core/usecases/PlayerTeamTransferHistoryUseCases";
import type { PlayerUseCases } from "../../core/usecases/PlayerUseCases";
import { create_player_use_cases } from "../../core/usecases/PlayerUseCases";
import type { ProfileLinkUseCases } from "../../core/usecases/ProfileLinkUseCases";
import { create_profile_link_use_cases } from "../../core/usecases/ProfileLinkUseCases";
import type { SystemUserUseCases } from "../../core/usecases/SystemUserUseCases";
import { create_system_user_use_cases } from "../../core/usecases/SystemUserUseCases";
import type { TeamProfileUseCases } from "../../core/usecases/TeamProfileUseCases";
import { create_team_profile_use_cases } from "../../core/usecases/TeamProfileUseCases";
import type { TeamStaffRoleUseCases } from "../../core/usecases/TeamStaffRoleUseCases";
import { create_team_staff_role_use_cases } from "../../core/usecases/TeamStaffRoleUseCases";
import type { TeamStaffUseCases } from "../../core/usecases/TeamStaffUseCases";
import { create_team_staff_use_cases } from "../../core/usecases/TeamStaffUseCases";
import type { TeamUseCases } from "../../core/usecases/TeamUseCases";
import { create_team_use_cases } from "../../core/usecases/TeamUseCases";
import { auth_store } from "../../presentation/stores/auth";
import { get_repository_container } from "../container";

export function get_official_associated_team_use_cases(): OfficialAssociatedTeamUseCases {
  return create_official_associated_team_use_cases(
    get_repository_container().official_associated_team_repository,
  );
}

export function get_official_performance_rating_use_cases(): OfficialPerformanceRatingUseCases {
  return create_official_performance_rating_use_cases(
    get_repository_container().official_performance_rating_repository,
    () => get(auth_store).current_profile,
  );
}

export function get_official_use_cases(): OfficialUseCases {
  return create_official_use_cases(
    get_repository_container().official_repository,
  );
}

export function get_player_position_use_cases(): PlayerPositionUseCases {
  return create_player_position_use_cases(
    get_repository_container().player_position_repository,
  );
}

export function get_player_profile_use_cases(): PlayerProfileUseCases {
  return create_player_profile_use_cases(
    get_repository_container().player_profile_repository,
  );
}

export function get_player_team_membership_use_cases(): PlayerTeamMembershipUseCases {
  return create_player_team_membership_use_cases(
    get_repository_container().player_team_membership_repository,
  );
}

export function get_player_team_transfer_history_use_cases(): PlayerTeamTransferHistoryUseCases {
  const container = get_repository_container();
  return create_player_team_transfer_history_use_cases(
    container.player_team_transfer_history_repository,
    container.player_team_membership_repository,
  );
}

export function get_player_use_cases(): PlayerUseCases {
  return create_player_use_cases(get_repository_container().player_repository);
}

export function get_profile_link_use_cases(): ProfileLinkUseCases {
  return create_profile_link_use_cases(
    get_repository_container().profile_link_repository,
  );
}

export function get_system_user_use_cases(): SystemUserUseCases {
  return create_system_user_use_cases(
    get_repository_container().system_user_repository,
  );
}

export function get_team_profile_use_cases(): TeamProfileUseCases {
  return create_team_profile_use_cases(
    get_repository_container().team_profile_repository,
  );
}

export function get_team_staff_role_use_cases(): TeamStaffRoleUseCases {
  return create_team_staff_role_use_cases(
    get_repository_container().team_staff_role_repository,
  );
}

export function get_team_staff_use_cases(): TeamStaffUseCases {
  const container = get_repository_container();
  return create_team_staff_use_cases(
    container.team_staff_repository,
    container.team_staff_role_repository,
  );
}

export function get_team_use_cases(): TeamUseCases {
  return create_team_use_cases(get_repository_container().team_repository);
}
