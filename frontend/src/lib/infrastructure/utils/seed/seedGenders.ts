import type { Gender } from "../../../core/entities/Gender";
import type { ScalarValueInput } from "../../../core/types/DomainScalars";
import { generate_current_timestamp } from "./seedIds";

export function create_seed_genders(
  organization_id: ScalarValueInput<Gender["organization_id"]>,
): import("$lib/core/types/DomainScalars").ScalarInput<Gender>[] {
  const now = generate_current_timestamp();

  return [
    {
      id: `gender_default_male_${organization_id}`,
      name: "Male",
      description: "Male gender",
      status: "active",
      organization_id,
      created_at: now,
      updated_at: now,
    },
    {
      id: `gender_default_female_${organization_id}`,
      name: "Female",
      description: "Female gender",
      status: "active",
      organization_id,
      created_at: now,
      updated_at: now,
    },
  ];
}
