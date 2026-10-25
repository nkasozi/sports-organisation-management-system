import { derive_competition_status } from "$lib/core/entities/CompetitionHelpers";
import { COMPETITION_DERIVED_STATUS } from "$lib/core/entities/CompetitionTypes";
import type { SidebarMenuGroup } from "$lib/core/interfaces/ports";

import { is_route_in_accessible_set } from "./authGuardRoutes";
import {
  type ConceptGuideSources,
  type GuideCompetition,
  list_guide_records,
} from "./conceptGuideLoader";
import { CONCEPT_LANE, type ConceptLane } from "./conceptGuideTypes";

interface NamedRecord {
  id: string;
  name?: unknown;
}

export interface GuideOption {
  value: string;
  label: string;
}

interface GuideLaneHeading {
  lane: ConceptLane;
  title: string;
  cadence: string;
}

export const GUIDE_LANES: GuideLaneHeading[] = [
  {
    lane: CONCEPT_LANE.SETUP,
    title: "Set up your organization",
    cadence: "once",
  },
  {
    lane: CONCEPT_LANE.COMPETITION,
    title: "Run a competition",
    cadence: "each season",
  },
  { lane: CONCEPT_LANE.MATCH_DAY, title: "Match day", cadence: "each game" },
];

export function choose_guide_organization_id(
  organizations: NamedRecord[],
  preferred_organization_id: string,
): string {
  const preferred = organizations.find(
    (organization) => organization.id === preferred_organization_id,
  );
  return preferred?.id ?? organizations[0]?.id ?? "";
}

export function to_guide_options(records: NamedRecord[]): GuideOption[] {
  return records
    .map((record) => ({ value: record.id, label: String(record.name ?? "") }))
    .sort((first, second) => first.label.localeCompare(second.label));
}

export function build_guide_route_checker(
  menu_groups: SidebarMenuGroup[],
): (route: string) => boolean {
  const accessible_routes = new Set(
    menu_groups.flatMap((group) => group.items.map((item) => item.href)),
  );
  return (route) => is_route_in_accessible_set(route, accessible_routes);
}

export async function load_guide_organizations(
  sources: ConceptGuideSources,
): Promise<NamedRecord[]> {
  return list_guide_records(sources.organizations);
}

const COMPETITION_STATUS_ORDER: string[] = [
  COMPETITION_DERIVED_STATUS.ACTIVE,
  COMPETITION_DERIVED_STATUS.UPCOMING,
  COMPETITION_DERIVED_STATUS.COMPLETED,
];

export function order_guide_competitions(
  records: Record<string, unknown>[],
  today: Date = new Date(),
): GuideCompetition[] {
  const rank = (record: Record<string, unknown>): number =>
    COMPETITION_STATUS_ORDER.indexOf(
      derive_competition_status(
        String(record.start_date ?? ""),
        String(record.end_date ?? ""),
        today,
      ),
    );
  return [...records]
    .sort(
      (first, second) =>
        rank(first) - rank(second) ||
        String(first.name).localeCompare(String(second.name)),
    )
    .map((record) => ({
      id: String(record.id),
      name: String(record.name ?? ""),
    }));
}

export async function load_guide_competitions(
  sources: ConceptGuideSources,
  organization_id: string,
): Promise<GuideCompetition[]> {
  return order_guide_competitions(
    await list_guide_records(sources.competitions, { organization_id }),
  );
}
