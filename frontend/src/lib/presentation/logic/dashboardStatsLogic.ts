import type { FixtureStatus } from "$lib/core/entities/Fixture";
import { FIXTURE_STATUS } from "$lib/core/entities/StatusConstants";
import { ANY_VALUE } from "$lib/core/interfaces/ports";

import {
  DashboardOrganizationCountStatus,
  DashboardOrganizationScopeStatus,
} from "./dashboardPageConstants";

export type DashboardOrganizationScopeState =
  | { status: typeof DashboardOrganizationScopeStatus.UNSCOPED }
  | {
      status: typeof DashboardOrganizationScopeStatus.SCOPED;
      organization_id: string;
    };

export type DashboardOrganizationCountState =
  | { status: typeof DashboardOrganizationCountStatus.CALCULATED }
  | { status: typeof DashboardOrganizationCountStatus.FIXED; value: number };

export interface DashboardFilters {
  organization_scope_state: DashboardOrganizationScopeState;
  fixture_status: FixtureStatus;
  organization_count_state: DashboardOrganizationCountState;
}

export function build_dashboard_filters(
  role: string,
  organization_id: string,
): DashboardFilters {
  const has_unrestricted_org_scope =
    !organization_id || organization_id === ANY_VALUE;

  if (has_unrestricted_org_scope) {
    return {
      organization_scope_state: {
        status: DashboardOrganizationScopeStatus.UNSCOPED,
      },
      fixture_status: FIXTURE_STATUS.SCHEDULED,
      organization_count_state: {
        status: DashboardOrganizationCountStatus.CALCULATED,
      },
    };
  }

  return {
    organization_scope_state: {
      status: DashboardOrganizationScopeStatus.SCOPED,
      organization_id,
    },
    fixture_status: FIXTURE_STATUS.SCHEDULED,
    organization_count_state: {
      status: DashboardOrganizationCountStatus.FIXED,
      value: 1,
    },
  };
}
