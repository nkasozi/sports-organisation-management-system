const VIEWER_KEY_STORAGE_KEY = "sports-org-live-viewer-key";
const VIEWER_KEY_PREFIX = "viewer-";

type ViewerKeyStorage = Pick<Storage, "getItem" | "setItem">;

let in_memory_viewer_key = "";

function create_viewer_key(): string {
  return `${VIEWER_KEY_PREFIX}${crypto.randomUUID()}`;
}

function read_or_create_in_memory_key(): string {
  if (!in_memory_viewer_key) in_memory_viewer_key = create_viewer_key();
  return in_memory_viewer_key;
}

export function read_device_viewer_key(
  storage: ViewerKeyStorage | undefined = globalThis.localStorage,
): string {
  try {
    const saved_key = storage?.getItem(VIEWER_KEY_STORAGE_KEY);
    if (saved_key) return saved_key;
    const new_key = create_viewer_key();
    storage?.setItem(VIEWER_KEY_STORAGE_KEY, new_key);
    return new_key;
  } catch {
    return read_or_create_in_memory_key();
  }
}
