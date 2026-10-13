import type { FeatureAccess } from "$lib/core/interfaces/ports";
import { ANY_VALUE, check_data_permission } from "$lib/core/interfaces/ports";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import { AUTH_PERMISSION_LOG_EVENTS } from "./authPermissionConstants";
import type { AuthState } from "./authTypes";

export function compute_feature_access(state: AuthState): FeatureAccess {
  const profile_state = state.current_profile;
  if (profile_state.status !== PRESENCE_STATUS.PRESENT) {
    console.warn("[AuthStore] No profile available for feature access", {
      event: AUTH_PERMISSION_LOG_EVENTS.PROFILE_MISSING_FOR_FEATURE_ACCESS,
    });
    return {
      can_reset_demo: false,
      can_view_audit_logs: false,
      can_access_dashboard: false,
      can_switch_profiles: false,
      audit_logs_scope: "none",
    };
  }

  const role = profile_state.profile.role;
  const organization_id = profile_state.profile.organization_id;
  const has_unrestricted_org_scope = organization_id === ANY_VALUE;
  const can_manage_org = check_data_permission(
    role,
    "org_administrator_level",
    "read",
  );

  return {
    can_reset_demo: check_data_permission(role, "root_level", "delete"),
    can_view_audit_logs: can_manage_org,
    can_access_dashboard: true,
    can_switch_profiles: state.is_demo_session,
    audit_logs_scope: has_unrestricted_org_scope
      ? "all"
      : can_manage_org
        ? "organization"
        : "none",
  };
}
