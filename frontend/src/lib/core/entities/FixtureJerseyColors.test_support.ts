import type { ScalarInput } from "../types/DomainScalars";
import { type JerseyColorAssignment } from "./Fixture";

export const create_jersey_assignment = (
  color: string,
  nickname: string = "Test Jersey",
): ScalarInput<JerseyColorAssignment> => ({
  jersey_color_id: `jersey_${color}`,
  nickname,
  main_color: color,
});
