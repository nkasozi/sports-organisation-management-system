import type { IdentificationType } from "../../../core/entities/IdentificationType";
import {
  SEED_IDENTIFICATION_TYPE_IDS,
  SEED_ORGANIZATION_IDS,
  generate_current_timestamp,
} from "./seedIds";

export function create_seed_identification_types(
  organization_id: string,
): IdentificationType[] {
  const now = generate_current_timestamp();

  return [
    {
      id: `id_type_default_1_${organization_id}`,
      name: "National ID",
      identifier_field_label: "National ID Number",
      description: "Government-issued national identification card",
      status: "active",
      organization_id,
      created_at: now,
      updated_at: now,
    },
    {
      id: `id_type_default_2_${organization_id}`,
      name: "Passport",
      identifier_field_label: "Passport Number",
      description: "International travel passport",
      status: "active",
      organization_id,
      created_at: now,
      updated_at: now,
    },
    {
      id: `id_type_default_3_${organization_id}`,
      name: "Driving License",
      identifier_field_label: "License Number",
      description: "Government-issued driving permit",
      status: "active",
      organization_id,
      created_at: now,
      updated_at: now,
    },
    {
      id: `id_type_default_4_${organization_id}`,
      name: "Player Registration Number",
      identifier_field_label: "Registration Number",
      description: "Federation-assigned player registration number",
      status: "active",
      organization_id,
      created_at: now,
      updated_at: now,
    },
    {
      id: `id_type_default_5_${organization_id}`,
      name: "Federation ID",
      identifier_field_label: "Federation ID Number",
      description: "National hockey federation identification",
      status: "active",
      organization_id,
      created_at: now,
      updated_at: now,
    },
  ];
}
