import type { FixtureLineup } from "../../../core/entities/FixtureLineup";
import { create_seed_lineups_part1 } from "./seedLineups1";
import { create_seed_lineups_part2 } from "./seedLineups2";
import { create_seed_lineups_part3 } from "./seedLineups3";
import { create_seed_lineups_part4 } from "./seedLineups4";
import { create_seed_lineups_part5 } from "./seedLineups5";
import { create_seed_lineups_part6 } from "./seedLineups6";
import { create_seed_lineups_part7 } from "./seedLineups7";
import { create_seed_lineups_part8 } from "./seedLineups8";
import { create_seed_lineups_part9 } from "./seedLineups9";
import { create_seed_lineups_part10 } from "./seedLineups10";
import { create_seed_lineups_part11 } from "./seedLineups11";
import { create_seed_lineups_part12 } from "./seedLineups12";
import { create_seed_lineups_part13 } from "./seedLineups13";
import { create_seed_lineups_part14 } from "./seedLineups14";
import { create_seed_lineups_part15 } from "./seedLineups15";
import { create_seed_lineups_part16 } from "./seedLineups16";
import { create_seed_lineups_part17 } from "./seedLineups17";
import { create_seed_lineups_part18 } from "./seedLineups18";
import { create_seed_lineups_part19 } from "./seedLineups19";
import { create_seed_lineups_part20 } from "./seedLineups20";
import { create_seed_lineups_part21 } from "./seedLineups21";
import { create_seed_lineups_part22 } from "./seedLineups22";

export function create_seed_fixture_lineups(): import("$lib/core/types/DomainScalars").ScalarInput<FixtureLineup>[] {
  return [
    ...create_seed_lineups_part1(),
    ...create_seed_lineups_part2(),
    ...create_seed_lineups_part3(),
    ...create_seed_lineups_part4(),
    ...create_seed_lineups_part5(),
    ...create_seed_lineups_part6(),
    ...create_seed_lineups_part7(),
    ...create_seed_lineups_part8(),
    ...create_seed_lineups_part9(),
    ...create_seed_lineups_part10(),
    ...create_seed_lineups_part11(),
    ...create_seed_lineups_part12(),
    ...create_seed_lineups_part13(),
    ...create_seed_lineups_part14(),
    ...create_seed_lineups_part15(),
    ...create_seed_lineups_part16(),
    ...create_seed_lineups_part17(),
    ...create_seed_lineups_part18(),
    ...create_seed_lineups_part19(),
    ...create_seed_lineups_part20(),
    ...create_seed_lineups_part21(),
    ...create_seed_lineups_part22(),
  ];
}
