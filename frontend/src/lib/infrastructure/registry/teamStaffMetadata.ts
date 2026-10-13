import type { EntityMetadata } from "../../core/entities/BaseEntity";
import type { TeamStaff } from "../../core/entities/TeamStaff";
import { get_country_names_sorted_unique } from "../utils/countries";
import {
  TEAMSTAFF_DATE_OF_BIRTH_FIELD,
  TEAMSTAFF_EMAIL_FIELD,
  TEAMSTAFF_EMERGENCY_CONTACT_NAME_FIELD,
  TEAMSTAFF_EMERGENCY_CONTACT_PHONE_FIELD,
  TEAMSTAFF_EMPLOYMENT_END_DATE_FIELD,
  TEAMSTAFF_EMPLOYMENT_START_DATE_FIELD,
  TEAMSTAFF_FIRST_NAME_FIELD,
  TEAMSTAFF_IDENTIFICATIONS_FIELD,
  TEAMSTAFF_LAST_NAME_FIELD,
  TEAMSTAFF_NOTES_FIELD,
  TEAMSTAFF_ORGANIZATION_ID_FIELD,
  TEAMSTAFF_PHONE_FIELD,
  TEAMSTAFF_PROFILE_IMAGE_URL_FIELD,
  TEAMSTAFF_QUALIFICATIONS_FIELD,
  TEAMSTAFF_ROLE_ID_FIELD,
  TEAMSTAFF_STATUS_FIELD,
  TEAMSTAFF_TEAM_ID_FIELD,
} from "./teamStaffMetadataFields";

export function register_team_staff_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("teamstaff", {
    entity_name: "teamstaff",
    display_name: "Team Staff",
    fields: [
      TEAMSTAFF_ORGANIZATION_ID_FIELD,
      TEAMSTAFF_FIRST_NAME_FIELD,
      TEAMSTAFF_LAST_NAME_FIELD,
      TEAMSTAFF_EMAIL_FIELD,
      TEAMSTAFF_PHONE_FIELD,
      TEAMSTAFF_DATE_OF_BIRTH_FIELD,
      TEAMSTAFF_TEAM_ID_FIELD,
      TEAMSTAFF_ROLE_ID_FIELD,
      {
        field_name: "nationality" satisfies keyof TeamStaff,
        display_name: "Nationality",
        field_type: "enum",
        is_required: false,
        is_read_only: false,
        enum_values: get_country_names_sorted_unique(),
      },
      TEAMSTAFF_PROFILE_IMAGE_URL_FIELD,
      TEAMSTAFF_EMPLOYMENT_START_DATE_FIELD,
      TEAMSTAFF_EMPLOYMENT_END_DATE_FIELD,
      TEAMSTAFF_EMERGENCY_CONTACT_NAME_FIELD,
      TEAMSTAFF_EMERGENCY_CONTACT_PHONE_FIELD,
      TEAMSTAFF_NOTES_FIELD,
      TEAMSTAFF_STATUS_FIELD,
      TEAMSTAFF_QUALIFICATIONS_FIELD,
      TEAMSTAFF_IDENTIFICATIONS_FIELD,
    ],
  });
  return metadata_map;
}
