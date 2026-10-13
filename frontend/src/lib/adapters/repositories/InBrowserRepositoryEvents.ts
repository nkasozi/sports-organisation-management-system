export enum REPOSITORY_EVENT {
  COUNT_ENTITIES_FAILED = "repository_count_entities_failed",
  SEED_SUCCEEDED = "repository_seed_success",
  SEED_FAILED = "repository_seed_failed",
  CLEAR_FAILED = "repository_clear_failed",
  HAS_DATA_CHECK_FAILED = "repository_has_data_check_failed",
}

export enum REPOSITORY_OPERATION {
  COUNT_ENTITIES = "count entities",
  SEED_ENTITIES = "seed entities",
  CLEAR_ENTITIES = "clear entities",
  CHECK_FOR_DATA = "check for existing data",
}

export enum REPOSITORY_LOG_MESSAGE {
  COUNT_ENTITIES_FAILED = "[Repository] Failed to count entities",
  SEED_SUCCEEDED = "[Repository] Seeded records successfully",
  SEED_FAILED = "[Repository] Failed to seed data",
  CLEAR_FAILED = "[Repository] Failed to clear data",
  HAS_DATA_CHECK_FAILED = "[Repository] Failed to check data existence",
}

export enum REPOSITORY_CONTEXT_KEY {
  TABLE = "table",
  ENTITY_ID = "entity_id",
  ENTITY_PREFIX = "entity_prefix",
}

export enum BASE_REPOSITORY_OPERATION {
  FETCH_ENTITIES = "fetch entities",
  FETCH_ENTITY_BY_ID = "fetch entity by id",
  FETCH_ENTITIES_BY_IDS = "fetch entities by ids",
  CREATE_ENTITY = "create entity",
  UPDATE_ENTITY = "update entity",
  DELETE_ENTITY = "delete entity",
  DELETE_ENTITIES = "delete entities",
}
