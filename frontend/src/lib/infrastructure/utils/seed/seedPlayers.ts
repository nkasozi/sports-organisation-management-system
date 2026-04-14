import type { Player } from "../../../core/entities/Player";
import type { ScalarValueInput } from "../../../core/types/DomainScalars";
import { generate_current_timestamp } from "./seedIds";
import type { PositionIds } from "./seedPlayerIds";
import { resolve_seed_gender_id_for_first_name } from "./seedPlayerIds";
import { create_seed_players_group1 } from "./seedPlayersGroup1";
import { create_seed_players_group2 } from "./seedPlayersGroup2";
import { create_seed_players_group3 } from "./seedPlayersGroup3";
import { create_seed_players_group4 } from "./seedPlayersGroup4";
import { create_seed_players_group5 } from "./seedPlayersGroup5";
import { create_seed_players_group6 } from "./seedPlayersGroup6";
import { create_seed_players_group7 } from "./seedPlayersGroup7";
import { create_seed_players_group8 } from "./seedPlayersGroup8";
import { create_seed_players_group9 } from "./seedPlayersGroup9";
import { create_seed_players_group10 } from "./seedPlayersGroup10";
import { create_seed_players_group11 } from "./seedPlayersGroup11";
import { create_seed_players_group12 } from "./seedPlayersGroup12";

export function create_seed_players(
  positions: PositionIds,
  organization_id: ScalarValueInput<Player["organization_id"]>,
): import("$lib/core/types/DomainScalars").ScalarInput<Player>[] {
  const now = generate_current_timestamp();

  const players_without_gender: import("$lib/core/types/DomainScalars").ScalarInput<Omit<Player, "gender_id">>[] = [
    ...create_seed_players_group1(positions, organization_id, now),
    ...create_seed_players_group2(positions, organization_id, now),
    ...create_seed_players_group3(positions, organization_id, now),
    ...create_seed_players_group4(positions, organization_id, now),
    ...create_seed_players_group5(positions, organization_id, now),
    ...create_seed_players_group6(positions, organization_id, now),
    ...create_seed_players_group7(positions, organization_id, now),
    ...create_seed_players_group8(positions, organization_id, now),
    ...create_seed_players_group9(positions, organization_id, now),
    ...create_seed_players_group10(positions, organization_id, now),
    ...create_seed_players_group11(positions, organization_id, now),
    ...create_seed_players_group12(positions, organization_id, now),
  ];

  return players_without_gender.map((player) => ({
    ...player,
    gender_id: resolve_seed_gender_id_for_first_name(player.first_name),
  }));
}
