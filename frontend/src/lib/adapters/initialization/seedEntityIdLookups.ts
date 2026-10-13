import type { Result } from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import type { get_competition_format_repository } from "../repositories/InBrowserCompetitionFormatRepository";
import type { InBrowserGameOfficialRoleRepository } from "../repositories/InBrowserGameOfficialRoleRepository";
import type { InBrowserPlayerPositionRepository } from "../repositories/InBrowserPlayerPositionRepository";
import type { InBrowserTeamStaffRoleRepository } from "../repositories/InBrowserTeamStaffRoleRepository";
import { SEED_LOOKUP_PAGE_SIZE } from "./initializationConstants";
import {
  INITIALIZATION_ERROR_CODE,
  INITIALIZATION_EVENT,
} from "./initializationEvents";
import { INITIALIZATION_ERROR_MESSAGE } from "./initializationMessages";
import {
  build_seed_entity_id_lookups,
  type CodedRecord,
  type SeedLookupRecords,
} from "./seedEntityIdLookupCodes";
import type { SeedEntityIdLookups } from "./seedingTypes";

interface CodedRecordPage {
  items: CodedRecord[];
}

const PAGE_OPTIONS = { page_size: SEED_LOOKUP_PAGE_SIZE };

async function load_lookup_records(
  lookup_name: string,
  load: () => Promise<Result<CodedRecordPage>>,
): Promise<Result<CodedRecord[]>> {
  const load_result = await load();
  if (load_result.success) return create_success_result(load_result.data.items);
  console.error("[Seeding] Failed to load seed lookup records", {
    event: INITIALIZATION_EVENT.SEED_LOOKUPS_LOAD_FAILED,
    error_code: INITIALIZATION_ERROR_CODE.SEED_LOOKUPS_FAILED,
    lookup_name,
    error: load_result.error,
  });
  return create_failure_result(
    INITIALIZATION_ERROR_MESSAGE.SEED_LOOKUPS_FAILED,
  );
}

async function load_all_lookup_records(
  player_position_repository: InBrowserPlayerPositionRepository,
  team_staff_role_repository: InBrowserTeamStaffRoleRepository,
  official_role_repository: InBrowserGameOfficialRoleRepository,
  competition_format_repository: ReturnType<
    typeof get_competition_format_repository
  >,
): Promise<Result<SeedLookupRecords>> {
  const positions = await load_lookup_records("player_positions", () =>
    player_position_repository.find_all({}, PAGE_OPTIONS),
  );
  if (!positions.success) return positions;
  const staff_roles = await load_lookup_records("team_staff_roles", () =>
    team_staff_role_repository.find_all_with_filter({}, PAGE_OPTIONS),
  );
  if (!staff_roles.success) return staff_roles;
  const official_roles = await load_lookup_records("game_official_roles", () =>
    official_role_repository.find_all_with_filter({}, PAGE_OPTIONS),
  );
  if (!official_roles.success) return official_roles;
  const formats = await load_lookup_records("competition_formats", () =>
    competition_format_repository.find_all({}, PAGE_OPTIONS),
  );
  if (!formats.success) return formats;
  return create_success_result({
    positions: positions.data,
    staff_roles: staff_roles.data,
    official_roles: official_roles.data,
    formats: formats.data,
  });
}

export async function load_seed_entity_id_lookups(
  player_position_repository: InBrowserPlayerPositionRepository,
  team_staff_role_repository: InBrowserTeamStaffRoleRepository,
  official_role_repository: InBrowserGameOfficialRoleRepository,
  competition_format_repository: ReturnType<
    typeof get_competition_format_repository
  >,
): Promise<Result<SeedEntityIdLookups>> {
  console.log("[Seeding] Loading seed entity id lookups", {
    event: INITIALIZATION_EVENT.SEED_LOOKUPS_LOADING,
  });
  const records_result = await load_all_lookup_records(
    player_position_repository,
    team_staff_role_repository,
    official_role_repository,
    competition_format_repository,
  );
  if (!records_result.success) return records_result;
  const lookups = build_seed_entity_id_lookups(records_result.data);
  console.log("[Seeding] Seed entity id lookups loaded", {
    event: INITIALIZATION_EVENT.SEED_LOOKUPS_LOADED,
  });
  return create_success_result(lookups);
}
