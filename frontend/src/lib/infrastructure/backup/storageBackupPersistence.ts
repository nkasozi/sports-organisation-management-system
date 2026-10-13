const PERSISTENT_STORAGE_REQUEST_SETTLED_EVENT =
  "persistent_storage_request_settled";
const PERSISTENT_STORAGE_REQUEST_FAILED_EVENT =
  "persistent_storage_request_failed";
const FUNCTION_TYPE_NAME = "function";
const UNDEFINED_TYPE_NAME = "undefined";

const PERSISTENT_STORAGE_ACCESS_STATUS = {
  SUPPORTED: "supported",
  UNSUPPORTED: "unsupported",
} as const;

const PERSISTENT_STORAGE_REQUEST_STATUS = {
  UNSUPPORTED: "unsupported",
  ALREADY_PERSISTED: "already_persisted",
  GRANTED: "granted",
  DENIED: "denied",
  FAILED: "failed",
} as const;

const REQUEST_STATUS = PERSISTENT_STORAGE_REQUEST_STATUS;

const REQUESTER_LIFECYCLE_STATUS = {
  NOT_REQUESTED: "not_requested",
  REQUESTED: "requested",
} as const;

export type PersistentStorageRequestState =
  | { status: typeof REQUEST_STATUS.UNSUPPORTED }
  | { status: typeof REQUEST_STATUS.ALREADY_PERSISTED }
  | { status: typeof REQUEST_STATUS.GRANTED }
  | { status: typeof REQUEST_STATUS.DENIED }
  | { status: typeof REQUEST_STATUS.FAILED; error: string };

export type PersistentStorageManagerAccess =
  | {
      status: typeof PERSISTENT_STORAGE_ACCESS_STATUS.SUPPORTED;
      storage_manager: Pick<StorageManager, "persist" | "persisted">;
    }
  | { status: typeof PERSISTENT_STORAGE_ACCESS_STATUS.UNSUPPORTED };

type RequesterLifecycleState =
  | { status: typeof REQUESTER_LIFECYCLE_STATUS.NOT_REQUESTED }
  | {
      status: typeof REQUESTER_LIFECYCLE_STATUS.REQUESTED;
      completion: Promise<PersistentStorageRequestState>;
    };

interface PersistentStorageRequester {
  request_once(): Promise<PersistentStorageRequestState>;
}

export function get_navigator_persistent_storage_access(): PersistentStorageManagerAccess {
  if (typeof navigator === UNDEFINED_TYPE_NAME || !navigator.storage) {
    return { status: PERSISTENT_STORAGE_ACCESS_STATUS.UNSUPPORTED };
  }

  const storage_manager = navigator.storage;

  return typeof storage_manager.persist === FUNCTION_TYPE_NAME &&
    typeof storage_manager.persisted === FUNCTION_TYPE_NAME
    ? { status: PERSISTENT_STORAGE_ACCESS_STATUS.SUPPORTED, storage_manager }
    : { status: PERSISTENT_STORAGE_ACCESS_STATUS.UNSUPPORTED };
}

async function request_persistent_storage(
  access: PersistentStorageManagerAccess,
): Promise<PersistentStorageRequestState> {
  if (access.status === PERSISTENT_STORAGE_ACCESS_STATUS.UNSUPPORTED) {
    return { status: REQUEST_STATUS.UNSUPPORTED };
  }

  try {
    if (await access.storage_manager.persisted()) {
      return { status: REQUEST_STATUS.ALREADY_PERSISTED };
    }

    return (await access.storage_manager.persist())
      ? { status: REQUEST_STATUS.GRANTED }
      : { status: REQUEST_STATUS.DENIED };
  } catch (error) {
    console.warn("[StorageBackup] Persistent storage request failed", {
      event: PERSISTENT_STORAGE_REQUEST_FAILED_EVENT,
      error: String(error),
    });
    return { status: REQUEST_STATUS.FAILED, error: String(error) };
  }
}

function log_persistent_storage_request_state(
  request_state: PersistentStorageRequestState,
): PersistentStorageRequestState {
  console.log("[StorageBackup] Persistent storage request settled", {
    event: PERSISTENT_STORAGE_REQUEST_SETTLED_EVENT,
    status: request_state.status,
  });
  return request_state;
}

export function create_persistent_storage_requester(
  get_access: () => PersistentStorageManagerAccess,
): PersistentStorageRequester {
  let lifecycle_state: RequesterLifecycleState = {
    status: REQUESTER_LIFECYCLE_STATUS.NOT_REQUESTED,
  };

  function request_once(): Promise<PersistentStorageRequestState> {
    if (lifecycle_state.status === REQUESTER_LIFECYCLE_STATUS.REQUESTED) {
      return lifecycle_state.completion;
    }

    const completion = request_persistent_storage(get_access()).then(
      log_persistent_storage_request_state,
    );
    lifecycle_state = {
      status: REQUESTER_LIFECYCLE_STATUS.REQUESTED,
      completion,
    };
    return completion;
  }

  return { request_once };
}
