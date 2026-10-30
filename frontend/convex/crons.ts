import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";
import { AUDIT_LOG_RETENTION_DAYS } from "./audit_logs";
import { BackfillRunKind } from "./lib/sync_backfill_state";
import { SYNC_TOMBSTONE_RETENTION_DAYS } from "./lib/sync_tombstone_retention";

const SYNC_SEQUENCE_BACKFILL_INTERVAL_MINUTES = 5;

const crons = cronJobs();

crons.daily(
  "cleanup-old-audit-logs",
  { hourUTC: 3, minuteUTC: 0 },
  internal.audit_logs.delete_old_audit_logs_batch,
  { retention_days: AUDIT_LOG_RETENTION_DAYS },
);

crons.interval(
  "backfill-sync-change-sequences",
  { minutes: SYNC_SEQUENCE_BACKFILL_INTERVAL_MINUTES },
  internal.sync.backfill_sync_sequences_batch,
  { run: { kind: BackfillRunKind.SCHEDULED_START } },
);

crons.daily(
  "prune-expired-sync-tombstones",
  { hourUTC: 3, minuteUTC: 30 },
  internal.sync.prune_expired_tombstones_batch,
  { retention_days: SYNC_TOMBSTONE_RETENTION_DAYS, continuation_count: 0 },
);

crons.interval(
  "refresh-live-game-viewer-stats",
  { minutes: 1 },
  internal.live_audience_stats.refresh_live_game_viewer_stats,
  {},
);

crons.daily(
  "prune-old-live-game-viewers",
  { hourUTC: 4, minuteUTC: 0 },
  internal.live_audience_stats.prune_old_live_game_viewers,
  {},
);

export default crons;
