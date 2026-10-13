import type { IdentificationType } from "../../../core/entities/IdentificationType";
import type { ScalarValueInput } from "../../../core/types/DomainScalars";
import { generate_current_timestamp } from "./seedIds";

type SeedRow = Omit<
  import("$lib/core/types/DomainScalars").ScalarInput<IdentificationType>,
  "id" | "organization_id" | "created_at" | "updated_at"
>;

const ROW_1: SeedRow = {
  name: "National ID",
  identifier_field_label: "National ID Number",
  description: "Government-issued national identification card",
  status: "active",
};

const ROW_2: SeedRow = {
  name: "Passport",
  identifier_field_label: "Passport Number",
  description: "International travel passport",
  status: "active",
};

const ROW_3: SeedRow = {
  name: "Driving License",
  identifier_field_label: "License Number",
  description: "Government-issued driving permit",
  status: "active",
};

const ROW_4: SeedRow = {
  name: "Player Registration Number",
  identifier_field_label: "Registration Number",
  description: "Federation-assigned player registration number",
  status: "active",
};

const ROW_5: SeedRow = {
  name: "Federation ID",
  identifier_field_label: "Federation ID Number",
  description: "National hockey federation identification",
  status: "active",
};

export function create_seed_identification_types(
  organization_id: ScalarValueInput<IdentificationType["organization_id"]>,
): import("$lib/core/types/DomainScalars").ScalarInput<IdentificationType>[] {
  const now = generate_current_timestamp();

  return [
    { ...ROW_1, id: `id_type_default_1_${organization_id}` },
    { ...ROW_2, id: `id_type_default_2_${organization_id}` },
    { ...ROW_3, id: `id_type_default_3_${organization_id}` },
    { ...ROW_4, id: `id_type_default_4_${organization_id}` },
    { ...ROW_5, id: `id_type_default_5_${organization_id}` },
  ].map((row) => ({
    ...row,
    organization_id,
    created_at: now,
    updated_at: now,
  }));
}
