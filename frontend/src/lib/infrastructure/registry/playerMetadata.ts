import type { EntityMetadata } from "../../core/entities/BaseEntity";
import type { Player } from "../../core/entities/Player";
import { get_country_names_sorted_unique } from "../utils/countries";
import {
  PLAYER_DATE_OF_BIRTH_FIELD,
  PLAYER_EMAIL_FIELD,
  PLAYER_EMERGENCY_CONTACT_NAME_FIELD,
  PLAYER_EMERGENCY_CONTACT_PHONE_FIELD,
  PLAYER_FIRST_NAME_FIELD,
  PLAYER_GENDER_ID_FIELD,
  PLAYER_HEIGHT_CM_FIELD,
  PLAYER_IDENTIFICATIONS_FIELD,
  PLAYER_LAST_NAME_FIELD,
  PLAYER_MEDICAL_NOTES_FIELD,
  PLAYER_ORGANIZATION_ID_FIELD,
  PLAYER_PHONE_FIELD,
  PLAYER_POSITION_ID_FIELD,
  PLAYER_PROFILE_IMAGE_URL_FIELD,
  PLAYER_STATUS_FIELD,
  PLAYER_WEIGHT_KG_FIELD,
} from "./playerMetadataFields";

export function register_player_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("player", {
    entity_name: "player",
    display_name: "Player",
    fields: [
      PLAYER_ORGANIZATION_ID_FIELD,
      PLAYER_FIRST_NAME_FIELD,
      PLAYER_LAST_NAME_FIELD,
      PLAYER_GENDER_ID_FIELD,
      PLAYER_POSITION_ID_FIELD,
      PLAYER_DATE_OF_BIRTH_FIELD,
      {
        field_name: "nationality" satisfies keyof Player,
        display_name: "Nationality",
        field_type: "enum",
        is_required: true,
        is_read_only: false,
        enum_values: get_country_names_sorted_unique(),
        show_in_list: true,
      },
      PLAYER_EMAIL_FIELD,
      PLAYER_PHONE_FIELD,
      PLAYER_HEIGHT_CM_FIELD,
      PLAYER_WEIGHT_KG_FIELD,
      PLAYER_PROFILE_IMAGE_URL_FIELD,
      PLAYER_EMERGENCY_CONTACT_NAME_FIELD,
      PLAYER_EMERGENCY_CONTACT_PHONE_FIELD,
      PLAYER_MEDICAL_NOTES_FIELD,
      PLAYER_STATUS_FIELD,
      PLAYER_IDENTIFICATIONS_FIELD,
    ],
  });
  return metadata_map;
}
