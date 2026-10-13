import type { Fixture } from "$lib/core/entities/Fixture";
import { FIXTURE_STATUS } from "$lib/core/entities/StatusConstants";
import type { AsyncResult } from "$lib/core/types/Result";
import { USER_ROLE } from "$lib/presentation/components/auth/userRoleConstants";

export const FIXTURE_DETAIL_PAGE_STATUS = {
  LOADING: "loading",
  LOADED: "loaded",
  FAILED: "failed",
} as const;

export const FIXTURE_DETAIL_MESSAGES = {
  LOAD_FAILED:
    "We couldn't load this fixture. Please check your connection and try again.",
  NOT_FOUND: "This fixture could not be found. It may have been deleted.",
} as const;

export const FIXTURE_DETAIL_PATHS = {
  SIGN_IN: "/sign-in",
  FIXTURES: "/fixtures",
} as const;

const FIXTURE_DETAIL_LOAD_FAILED_EVENT = "fixture_detail_load_failed";
const DEFAULT_STATUS_BADGE_CLASS = "bg-gray-100 text-gray-600";
const STATUS_BADGE_CLASSES: Record<string, string> = {
  [FIXTURE_STATUS.SCHEDULED]: "bg-blue-100 text-blue-700",
  [FIXTURE_STATUS.IN_PROGRESS]: "bg-amber-100 text-amber-700",
  [FIXTURE_STATUS.COMPLETED]: "bg-emerald-100 text-emerald-700",
  [FIXTURE_STATUS.POSTPONED]: "bg-gray-100 text-gray-700",
  [FIXTURE_STATUS.CANCELLED]: "bg-red-100 text-red-700",
};
const OFFICIAL_RATER_ROLES: readonly string[] = [
  USER_ROLE.OFFICIALS_MANAGER,
  USER_ROLE.TEAM_MANAGER,
];
const GAME_MANAGER_ROLES: readonly string[] = [
  USER_ROLE.OFFICIALS_MANAGER,
  USER_ROLE.ORG_ADMIN,
  USER_ROLE.SUPER_ADMIN,
];

export type FixtureDetailPageState =
  | { status: typeof FIXTURE_DETAIL_PAGE_STATUS.LOADING }
  | { status: typeof FIXTURE_DETAIL_PAGE_STATUS.LOADED; fixture: Fixture }
  | { status: typeof FIXTURE_DETAIL_PAGE_STATUS.FAILED; message: string };

export async function load_fixture_detail(
  fixture_id: string,
  get_fixture_by_id: (fixture_id: string) => AsyncResult<Fixture>,
): Promise<FixtureDetailPageState> {
  const result = await get_fixture_by_id(fixture_id);
  if (result.success && result.data)
    return { status: FIXTURE_DETAIL_PAGE_STATUS.LOADED, fixture: result.data };
  console.error("[FixtureDetailPage] Failed to load fixture", {
    event: FIXTURE_DETAIL_LOAD_FAILED_EVENT,
    fixture_id,
    error: result.success ? FIXTURE_DETAIL_MESSAGES.NOT_FOUND : result.error,
  });
  return {
    status: FIXTURE_DETAIL_PAGE_STATUS.FAILED,
    message: result.success
      ? FIXTURE_DETAIL_MESSAGES.NOT_FOUND
      : FIXTURE_DETAIL_MESSAGES.LOAD_FAILED,
  };
}

export function is_completed_fixture(fixture: Fixture): boolean {
  return fixture.status === FIXTURE_STATUS.COMPLETED;
}

export function can_role_rate_officials(role: string): boolean {
  return OFFICIAL_RATER_ROLES.includes(role);
}

export function can_role_manage_game(role: string): boolean {
  return GAME_MANAGER_ROLES.includes(role);
}

export function get_fixture_status_badge_class(status: string): string {
  return STATUS_BADGE_CLASSES[status] ?? DEFAULT_STATUS_BADGE_CLASS;
}
