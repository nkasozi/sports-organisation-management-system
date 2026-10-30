export const LIVE_AUDIENCE_HEARTBEAT_MS = 20_000;
export const LIVE_AUDIENCE_ACTIVE_WINDOW_MS = 45_000;
export const LIVE_AUDIENCE_MAX_WATCH_CREDIT_MS = 2 * LIVE_AUDIENCE_HEARTBEAT_MS;
export const LIVE_AUDIENCE_STATS_LOOKBACK_MS = 2 * 60_000;
export const LIVE_AUDIENCE_VIEWER_RETENTION_MS = 3 * 24 * 60 * 60_000;
export const LIVE_AUDIENCE_SHOWN_FACES = 5;
export const LIVE_AUDIENCE_SCAN_LIMIT = 5_000;
export const LIVE_FIXTURE_STATUS = "in_progress";

const VIEWER_KEY_PATTERN = /^[a-z0-9-]{16,64}$/i;
const FACE_COLOR_COUNT = 8;
const FNV_OFFSET_BASIS = 2166136261;
const FNV_PRIME = 16777619;

const ANONYMOUS_ANIMALS = [
  "Crane",
  "Lion",
  "Zebra",
  "Giraffe",
  "Elephant",
  "Cheetah",
  "Rhino",
  "Hippo",
  "Leopard",
  "Buffalo",
  "Antelope",
  "Gorilla",
  "Flamingo",
  "Eagle",
  "Falcon",
  "Dolphin",
  "Penguin",
  "Panda",
  "Koala",
  "Fox",
  "Owl",
  "Otter",
  "Kangaroo",
  "Tortoise",
] as const;

export interface AnonymousFace {
  name: string;
  color_index: number;
}

export interface WatchingViewer {
  viewer_key: string;
  last_seen_at: number;
  is_watching: boolean;
}

export function is_valid_viewer_key(viewer_key: string): boolean {
  return VIEWER_KEY_PATTERN.test(viewer_key);
}

function hash_text(text: string): number {
  let hash = FNV_OFFSET_BASIS;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }
  return hash;
}

export function build_anonymous_face(
  fixture_id: string,
  viewer_key: string,
): AnonymousFace {
  const hash = hash_text(`${fixture_id}:${viewer_key}`);
  const animal = ANONYMOUS_ANIMALS[hash % ANONYMOUS_ANIMALS.length];
  return {
    name: `Anonymous ${animal}`,
    color_index: Math.floor(hash / ANONYMOUS_ANIMALS.length) % FACE_COLOR_COUNT,
  };
}

export function is_viewer_watching(
  viewer: WatchingViewer,
  now_ms: number,
): boolean {
  return (
    viewer.is_watching &&
    now_ms - viewer.last_seen_at <= LIVE_AUDIENCE_ACTIVE_WINDOW_MS
  );
}

export function credit_watch_time(
  viewer: WatchingViewer,
  now_ms: number,
): number {
  if (!viewer.is_watching) return 0;
  const elapsed_ms = Math.max(0, now_ms - viewer.last_seen_at);
  return Math.min(elapsed_ms, LIVE_AUDIENCE_MAX_WATCH_CREDIT_MS);
}
