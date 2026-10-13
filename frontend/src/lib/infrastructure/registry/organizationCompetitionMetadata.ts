import type { EntityMetadata } from "../../core/entities/BaseEntity";
import {
  COMPETITION_DESCRIPTION_FIELD,
  COMPETITION_END_DATE_FIELD,
  COMPETITION_MAX_TEAMS_FIELD,
  COMPETITION_NAME_FIELD,
  COMPETITION_OFFICIAL_JERSEY_COLORS_FIELD,
  COMPETITION_ORGANIZATION_ID_FIELD,
  COMPETITION_REGISTRATION_DEADLINE_FIELD,
  COMPETITION_START_DATE_FIELD,
  ORGANIZATION_ADDRESS_FIELD,
  ORGANIZATION_CONTACT_EMAIL_FIELD,
  ORGANIZATION_CONTACT_PHONE_FIELD,
  ORGANIZATION_DESCRIPTION_FIELD,
  ORGANIZATION_FOUNDED_DATE_FIELD,
  ORGANIZATION_NAME_FIELD,
  ORGANIZATION_SPORT_ID_FIELD,
  ORGANIZATION_STATUS_FIELD,
  ORGANIZATION_WEBSITE_FIELD,
} from "./organizationCompetitionMetadataFields";

export function register_organization_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("organization", {
    entity_name: "organization",
    display_name: "Organization",
    fields: [
      ORGANIZATION_NAME_FIELD,
      ORGANIZATION_DESCRIPTION_FIELD,
      ORGANIZATION_SPORT_ID_FIELD,
      ORGANIZATION_FOUNDED_DATE_FIELD,
      ORGANIZATION_CONTACT_EMAIL_FIELD,
      ORGANIZATION_CONTACT_PHONE_FIELD,
      ORGANIZATION_ADDRESS_FIELD,
      ORGANIZATION_WEBSITE_FIELD,
      ORGANIZATION_STATUS_FIELD,
    ],
  });
  return metadata_map;
}

export function register_competition_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("competition", {
    entity_name: "competition",
    display_name: "Competition",
    fields: [
      COMPETITION_NAME_FIELD,
      COMPETITION_DESCRIPTION_FIELD,
      COMPETITION_ORGANIZATION_ID_FIELD,
      COMPETITION_START_DATE_FIELD,
      COMPETITION_END_DATE_FIELD,
      COMPETITION_MAX_TEAMS_FIELD,
      COMPETITION_REGISTRATION_DEADLINE_FIELD,
      COMPETITION_OFFICIAL_JERSEY_COLORS_FIELD,
    ],
  });
  return metadata_map;
}
