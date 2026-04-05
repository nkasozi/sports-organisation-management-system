import type { PlayerPosition } from "../../core/entities/PlayerPosition";
import type { TeamStaffRole } from "../../core/entities/TeamStaffRole";
import type { GameOfficialRole } from "../../core/entities/GameOfficialRole";
import type { CompetitionFormat } from "../../core/entities/CompetitionFormat";
import type { InBrowserPlayerPositionRepository } from "../repositories/InBrowserPlayerPositionRepository";
import type { InBrowserTeamStaffRoleRepository } from "../repositories/InBrowserTeamStaffRoleRepository";
import type { InBrowserGameOfficialRoleRepository } from "../repositories/InBrowserGameOfficialRoleRepository";
import { get_competition_format_repository } from "../repositories/InBrowserCompetitionFormatRepository";
import type { Result } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import type { SeedEntityIdLookups } from "./seedingTypes";

function find_position_id_by_code(
  code: string,
  positions: PlayerPosition[],
): string {
  return positions.find((p) => p.code === code)?.id ?? "";
}

function find_staff_role_id_by_code(
  code: string,
  roles: TeamStaffRole[],
): string {
  return roles.find((r) => r.code === code)?.id ?? "";
}

function find_official_role_id_by_code(
  code: string,
  roles: GameOfficialRole[],
): string {
  return roles.find((r) => r.code === code)?.id ?? "";
}

function find_competition_format_id_by_code(
  code: string,
  formats: CompetitionFormat[],
): string {
  return formats.find((f) => f.code === code)?.id ?? "";
}

export async function load_seed_entity_id_lookups(
  player_position_repository: InBrowserPlayerPositionRepository,
  team_staff_role_repository: InBrowserTeamStaffRoleRepository,
  official_role_repository: InBrowserGameOfficialRoleRepository,
  competition_format_repository: ReturnType<
    typeof get_competition_format_repository
  >,
): Promise<Result<SeedEntityIdLookups>> {
  console.log("[Seeding] Loading entity ID lookups from seeded data");

  const positions_result = await player_position_repository.find_all(
    undefined,
    { page_size: 100 },
  );
  if (!positions_result.success)
    return create_failure_result(
      `Failed to load positions: ${positions_result.error}`,
    );

  const staff_roles_result =
    await team_staff_role_repository.find_all_with_filter(undefined, {
      page_size: 100,
    });
  if (!staff_roles_result.success)
    return create_failure_result(
      `Failed to load staff roles: ${staff_roles_result.error}`,
    );

  const official_roles_result =
    await official_role_repository.find_all_with_filter(undefined, {
      page_size: 100,
    });
  if (!official_roles_result.success)
    return create_failure_result(
      `Failed to load official roles: ${official_roles_result.error}`,
    );

  const formats_result = await competition_format_repository.find_all(
    undefined,
    { page_size: 100 },
  );
  if (!formats_result.success)
    return create_failure_result(
      `Failed to load competition formats: ${formats_result.error}`,
    );

  const positions = positions_result.data.items;
  const staff_roles = staff_roles_result.data.items;
  const official_roles = official_roles_result.data.items;
  const formats = formats_result.data.items;

  const lookups: SeedEntityIdLookups = {
    position_ids: {
      gk: find_position_id_by_code("GK", positions),
      sw: find_position_id_by_code("SW", positions),
      cb: find_position_id_by_code("CB", positions),
      lb: find_position_id_by_code("LB", positions),
      rb: find_position_id_by_code("RB", positions),
      cdm: find_position_id_by_code("CDM", positions),
      cm: find_position_id_by_code("CM", positions),
      lm: find_position_id_by_code("LM", positions),
      rm: find_position_id_by_code("RM", positions),
      lw: find_position_id_by_code("LW", positions),
      rw: find_position_id_by_code("RW", positions),
      cf: find_position_id_by_code("CF", positions),
    },
    head_coach_role_id: find_staff_role_id_by_code("HC", staff_roles),
    assistant_coach_role_id: find_staff_role_id_by_code("AC", staff_roles),
    physio_role_id: find_staff_role_id_by_code("PHYSIO", staff_roles),
    team_manager_role_id: find_staff_role_id_by_code("TM", staff_roles),
    referee_role_id: find_official_role_id_by_code("REF", official_roles),
    assistant_referee_role_id: find_official_role_id_by_code(
      "AR",
      official_roles,
    ),
    competition_format_ids: {
      easter_cup_format_id: find_competition_format_id_by_code(
        "world_cup_style",
        formats,
      ),
      uganda_cup_format_id: find_competition_format_id_by_code(
        "cup_tournament",
        formats,
      ),
      nhl_format_id: find_competition_format_id_by_code(
        "standard_league",
        formats,
      ),
      university_format_id: find_competition_format_id_by_code(
        "single_round_robin",
        formats,
      ),
    },
  };

  console.log("[Seeding] Entity ID lookups loaded successfully");
  return create_success_result(lookups);
}
