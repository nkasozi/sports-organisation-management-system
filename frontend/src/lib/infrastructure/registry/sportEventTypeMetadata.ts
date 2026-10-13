import type { EntityMetadata } from "../../core/entities/BaseEntity";
import {
  GAMEEVENTTYPE_CATEGORY_FIELD,
  GAMEEVENTTYPE_CODE_FIELD,
  GAMEEVENTTYPE_COLOR_FIELD,
  GAMEEVENTTYPE_DESCRIPTION_FIELD,
  GAMEEVENTTYPE_DISPLAY_ORDER_FIELD,
  GAMEEVENTTYPE_ICON_FIELD,
  GAMEEVENTTYPE_NAME_FIELD,
  GAMEEVENTTYPE_ORGANIZATION_ID_FIELD,
  GAMEEVENTTYPE_SPORT_ID_FIELD,
  GAMEEVENTTYPE_STATUS_FIELD,
  SPORT_CODE_FIELD,
  SPORT_DESCRIPTION_FIELD,
  SPORT_ICON_URL_FIELD,
  SPORT_MAX_PLAYERS_ON_FIELD_FIELD,
  SPORT_MAX_SQUAD_SIZE_FIELD,
  SPORT_MIN_PLAYERS_ON_FIELD_FIELD,
  SPORT_NAME_FIELD,
  SPORT_STANDARD_GAME_DURATION_MINUTES_FIELD,
  SPORT_STATUS_FIELD,
} from "./sportEventTypeMetadataFields";

export function register_sport_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("sport", {
    entity_name: "sport",
    display_name: "Sport",
    fields: [
      SPORT_NAME_FIELD,
      SPORT_CODE_FIELD,
      SPORT_DESCRIPTION_FIELD,
      SPORT_ICON_URL_FIELD,
      SPORT_STANDARD_GAME_DURATION_MINUTES_FIELD,
      SPORT_MAX_PLAYERS_ON_FIELD_FIELD,
      SPORT_MIN_PLAYERS_ON_FIELD_FIELD,
      SPORT_MAX_SQUAD_SIZE_FIELD,
      SPORT_STATUS_FIELD,
    ],
  });
  return metadata_map;
}

export function register_game_event_type_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("gameeventtype", {
    entity_name: "gameeventtype",
    display_name: "Game Event Type",
    fields: [
      GAMEEVENTTYPE_NAME_FIELD,
      GAMEEVENTTYPE_CODE_FIELD,
      GAMEEVENTTYPE_DESCRIPTION_FIELD,
      GAMEEVENTTYPE_ICON_FIELD,
      GAMEEVENTTYPE_COLOR_FIELD,
      GAMEEVENTTYPE_CATEGORY_FIELD,
      GAMEEVENTTYPE_DISPLAY_ORDER_FIELD,
      GAMEEVENTTYPE_SPORT_ID_FIELD,
      GAMEEVENTTYPE_STATUS_FIELD,
      GAMEEVENTTYPE_ORGANIZATION_ID_FIELD,
    ],
  });
  return metadata_map;
}
