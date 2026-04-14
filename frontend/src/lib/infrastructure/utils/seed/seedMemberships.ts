import type { PlayerTeamMembership } from "../../../core/entities/PlayerTeamMembership";
import { create_seed_memberships_part1 } from "./seedMemberships1";
import { create_seed_memberships_part2 } from "./seedMemberships2";
import { create_seed_memberships_part3 } from "./seedMemberships3";
import { create_seed_memberships_part4 } from "./seedMemberships4";
import { create_seed_memberships_part5 } from "./seedMemberships5";
import { create_seed_memberships_part6 } from "./seedMemberships6";
import { create_seed_memberships_part7 } from "./seedMemberships7";

export function create_seed_player_team_memberships(): import("$lib/core/types/DomainScalars").ScalarInput<PlayerTeamMembership>[] {
  return [
    ...create_seed_memberships_part1(),
    ...create_seed_memberships_part2(),
    ...create_seed_memberships_part3(),
    ...create_seed_memberships_part4(),
    ...create_seed_memberships_part5(),
    ...create_seed_memberships_part6(),
    ...create_seed_memberships_part7(),
  ];
}
