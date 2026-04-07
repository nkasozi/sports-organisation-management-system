import type { PlayerTeamMembership } from "../../../core/entities/PlayerTeamMembership";
import {
  generate_current_timestamp,
  SEED_ORGANIZATION_IDS,
  SEED_TEAM_IDS,
} from "./seedIds";
import { SEED_PLAYER_IDS } from "./seedPlayerIds";

export function create_seed_memberships_part7(): PlayerTeamMembership[] {
  const now = generate_current_timestamp();

  return [
    {
      id: "player_team_membership_default_91",
      organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
      player_id: SEED_PLAYER_IDS.ROCKETS_WOMEN_P11,
      team_id: SEED_TEAM_IDS.ROCKETS_HC_WOMEN,
      start_date: "2024-01-01",
      jersey_number: 11,
      status: "active",
      created_at: now,
      updated_at: now,
    },
  ];
}
