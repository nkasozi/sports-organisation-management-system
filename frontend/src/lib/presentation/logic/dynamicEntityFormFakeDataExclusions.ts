import { MEMBERSHIP_STATUS } from "../../core/entities/StatusConstants";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import { normalize_entity_type } from "./entityCrudWrapperLogic";

export type FakeDataExclusions = Readonly<Record<string, ReadonlySet<string>>>;

export const NO_FAKE_DATA_EXCLUSIONS: FakeDataExclusions = {};

const MEMBERSHIP_ENTITY_TYPE = "playerteammembership";
const PLAYER_FIELD_NAME = "player_id";
const ALL_ACTIVE_PAGE_SIZE = 10000;
const EXCLUSIONS_FAILED_EVENT = "dynamic_form_fake_data_exclusions_failed";

export interface ActiveMembershipSource {
  list(
    filter: { status: string },
    options: { page_size: number },
  ): PaginatedAsyncResult<{ player_id: string }>;
}

async function load_players_on_teams(
  source: ActiveMembershipSource,
): Promise<FakeDataExclusions> {
  const result = await source.list(
    { status: MEMBERSHIP_STATUS.ACTIVE },
    { page_size: ALL_ACTIVE_PAGE_SIZE },
  );
  if (!result.success) {
    console.warn("[DynamicEntityForm] Players on teams could not be loaded", {
      event: EXCLUSIONS_FAILED_EVENT,
      error: result.error,
    });
    return NO_FAKE_DATA_EXCLUSIONS;
  }
  return {
    [PLAYER_FIELD_NAME]: new Set(
      result.data.items.map((membership) => String(membership.player_id)),
    ),
  };
}

export function load_fake_data_exclusions(
  entity_type: string,
  membership_source: ActiveMembershipSource,
): Promise<FakeDataExclusions> {
  switch (normalize_entity_type(entity_type)) {
    case MEMBERSHIP_ENTITY_TYPE:
      return load_players_on_teams(membership_source);
    default:
      return Promise.resolve(NO_FAKE_DATA_EXCLUSIONS);
  }
}
