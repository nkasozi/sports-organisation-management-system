export enum SPORT_SERVICE_EVENT {
  CREATE_SPORT_FAILED = "sport_service_create_sport_failed",
  UPDATE_SPORT_FAILED = "sport_service_update_sport_failed",
  DELETE_SPORT_FAILED = "sport_service_delete_sport_failed",
}

export enum SPORT_SERVICE_LOG_MESSAGE {
  CREATE_SPORT_FAILED = "[SportService] Failed to create sport",
  UPDATE_SPORT_FAILED = "[SportService] Failed to update sport",
  DELETE_SPORT_FAILED = "[SportService] Failed to delete sport",
}

export enum SPORT_SERVICE_MESSAGE {
  SPORT_ID_REQUIRED = "Sport ID is required",
  SPORT_CODE_REQUIRED = "Sport code is required",
}

export function build_duplicate_sport_code_message(code: string): string {
  return `Sport with code '${code}' already exists`;
}
