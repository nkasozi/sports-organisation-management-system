import type { Team } from "../../../core/entities/Team";
import { create_seed_teams_men } from "./seedTeamsMen";
import { create_seed_teams_women } from "./seedTeamsWomen";

export function create_seed_teams(
  lugogo_stadium_id: string,
  kyambogo_pitch_id: string,
  makerere_ground_id: string,
  entebbe_club_id: string,
  jinja_ground_id: string,
): import("$lib/core/types/DomainScalars").ScalarInput<Team>[] {
  return [
    ...create_seed_teams_men(
      lugogo_stadium_id,
      kyambogo_pitch_id,
      makerere_ground_id,
      entebbe_club_id,
      jinja_ground_id,
    ),
    ...create_seed_teams_women(
      lugogo_stadium_id,
      kyambogo_pitch_id,
      makerere_ground_id,
      entebbe_club_id,
      jinja_ground_id,
    ),
  ];
}
