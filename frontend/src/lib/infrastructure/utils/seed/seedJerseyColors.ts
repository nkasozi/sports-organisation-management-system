import type { JerseyColor } from "../../../core/entities/JerseyColor";
import { create_seed_jersey_colors_part1 } from "./seedJerseyColors1";
import { create_seed_jersey_colors_part2 } from "./seedJerseyColors2";

export function create_seed_jersey_colors(): import("$lib/core/types/DomainScalars").ScalarInput<JerseyColor>[] {
  return [
    ...create_seed_jersey_colors_part1(),
    ...create_seed_jersey_colors_part2(),
  ];
}
