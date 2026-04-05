import type { Fixture } from "../../../core/entities/Fixture";
import { create_seed_fixtures_part1 } from "./seedFixtures1";
import { create_seed_fixtures_part2 } from "./seedFixtures2";
import { create_seed_fixtures_part3 } from "./seedFixtures3";
import { create_seed_fixtures_part4 } from "./seedFixtures4";
import { create_seed_fixtures_part5 } from "./seedFixtures5";
import { create_seed_fixtures_part6 } from "./seedFixtures6";
import { create_seed_fixtures_part7 } from "./seedFixtures7";
import { create_seed_fixtures_part8 } from "./seedFixtures8";
import { create_seed_fixtures_part9 } from "./seedFixtures9";
import { create_seed_fixtures_part10 } from "./seedFixtures10";
import { create_seed_fixtures_part11 } from "./seedFixtures11";
import { create_seed_fixtures_part12 } from "./seedFixtures12";

export function create_seed_fixtures(
  referee_role_id: string,
  assistant_referee_role_id: string,
): Fixture[] {
  const next_week = new Date();
  next_week.setDate(next_week.getDate() + 7);
  const two_weeks = new Date();
  two_weeks.setDate(two_weeks.getDate() + 14);
  const three_weeks = new Date();
  three_weeks.setDate(three_weeks.getDate() + 21);

  return [
    ...create_seed_fixtures_part1(
      referee_role_id,
      assistant_referee_role_id,
      next_week,
      two_weeks,
      three_weeks,
    ),
    ...create_seed_fixtures_part2(
      referee_role_id,
      assistant_referee_role_id,
      next_week,
      two_weeks,
      three_weeks,
    ),
    ...create_seed_fixtures_part3(
      referee_role_id,
      assistant_referee_role_id,
      next_week,
      two_weeks,
      three_weeks,
    ),
    ...create_seed_fixtures_part4(
      referee_role_id,
      assistant_referee_role_id,
      next_week,
      two_weeks,
      three_weeks,
    ),
    ...create_seed_fixtures_part5(
      referee_role_id,
      assistant_referee_role_id,
      next_week,
      two_weeks,
      three_weeks,
    ),
    ...create_seed_fixtures_part6(
      referee_role_id,
      assistant_referee_role_id,
      next_week,
      two_weeks,
      three_weeks,
    ),
    ...create_seed_fixtures_part7(
      referee_role_id,
      assistant_referee_role_id,
      next_week,
      two_weeks,
      three_weeks,
    ),
    ...create_seed_fixtures_part8(
      referee_role_id,
      assistant_referee_role_id,
      next_week,
      two_weeks,
      three_weeks,
    ),
    ...create_seed_fixtures_part9(
      referee_role_id,
      assistant_referee_role_id,
      next_week,
      two_weeks,
      three_weeks,
    ),
    ...create_seed_fixtures_part10(
      referee_role_id,
      assistant_referee_role_id,
      next_week,
      two_weeks,
      three_weeks,
    ),
    ...create_seed_fixtures_part11(
      referee_role_id,
      assistant_referee_role_id,
      next_week,
      two_weeks,
      three_weeks,
    ),
    ...create_seed_fixtures_part12(
      referee_role_id,
      assistant_referee_role_id,
      next_week,
      two_weeks,
      three_weeks,
    ),
  ];
}
