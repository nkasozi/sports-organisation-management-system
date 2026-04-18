import type { FixtureStatus } from "$lib/core/entities/Fixture";
import { FIXTURE_STATUS } from "$lib/core/entities/StatusConstants";
import { ANY_VALUE } from "$lib/core/interfaces/ports";

export type DashboardOrganizationScopeState =
  | { status: "unscoped" }
  | { status: "scoped"; organization_id: string };

export type DashboardOrganizationCountState =
  | { status: "calculated" }
  | { status: "fixed"; value: number };

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
      organization_scope_state: { status: "unscoped" },
      fixture_status: FIXTURE_STATUS.SCHEDULED,
      organization_count_state: { status: "calculated" },
    };
  }

  return {
    organization_scope_state: { status: "scoped", organization_id },
    fixture_status: FIXTURE_STATUS.SCHEDULED,
    organization_count_state: { status: "fixed", value: 1 },
  };
}
