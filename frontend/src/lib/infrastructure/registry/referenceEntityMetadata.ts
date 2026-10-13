import type { EntityMetadata } from "../../core/entities/BaseEntity";
import {
  COMPETITIONSTAGE_COMPETITION_ID_FIELD,
  COMPETITIONSTAGE_NAME_FIELD,
  COMPETITIONSTAGE_STAGE_ORDER_FIELD,
  COMPETITIONSTAGE_STAGE_TYPE_FIELD,
  COMPETITIONSTAGE_STATUS_FIELD,
  GENDER_DESCRIPTION_FIELD,
  GENDER_NAME_FIELD,
  GENDER_ORGANIZATION_ID_FIELD,
  GENDER_STATUS_FIELD,
  IDENTIFICATIONTYPE_DESCRIPTION_FIELD,
  IDENTIFICATIONTYPE_IDENTIFIER_FIELD_LABEL_FIELD,
  IDENTIFICATIONTYPE_NAME_FIELD,
  IDENTIFICATIONTYPE_ORGANIZATION_ID_FIELD,
  IDENTIFICATIONTYPE_STATUS_FIELD,
} from "./referenceEntityMetadataFields";

export function register_competition_stage_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("competitionstage", {
    entity_name: "competitionstage",
    display_name: "Competition Stage",
    fields: [
      COMPETITIONSTAGE_COMPETITION_ID_FIELD,
      COMPETITIONSTAGE_NAME_FIELD,
      COMPETITIONSTAGE_STAGE_TYPE_FIELD,
      COMPETITIONSTAGE_STAGE_ORDER_FIELD,
      COMPETITIONSTAGE_STATUS_FIELD,
    ],
  });
  return metadata_map;
}

export function register_identification_type_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("identificationtype", {
    entity_name: "identificationtype",
    display_name: "Identification Type",
    fields: [
      IDENTIFICATIONTYPE_NAME_FIELD,
      IDENTIFICATIONTYPE_IDENTIFIER_FIELD_LABEL_FIELD,
      IDENTIFICATIONTYPE_DESCRIPTION_FIELD,
      IDENTIFICATIONTYPE_STATUS_FIELD,
      IDENTIFICATIONTYPE_ORGANIZATION_ID_FIELD,
    ],
  });
  return metadata_map;
}

export function register_gender_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("gender", {
    entity_name: "gender",
    display_name: "Gender",
    fields: [
      GENDER_NAME_FIELD,
      GENDER_DESCRIPTION_FIELD,
      GENDER_STATUS_FIELD,
      GENDER_ORGANIZATION_ID_FIELD,
    ],
  });
  return metadata_map;
}
