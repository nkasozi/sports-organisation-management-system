import type { LastSyncTimeState } from "$lib/presentation/stores/syncStoreTypes";

type FormatRelativeSyncTimeCommand = {
  last_sync: LastSyncTimeState;
  relative_time_tick: number;
};

type FormatSyncStatusTextCommand = {
  sync_in_progress: boolean;
  last_sync: LastSyncTimeState;
  current_percentage: number;
  relative_time_tick: number;
};

const LAST_SYNC_STATUS = {
  NEVER: "never",
  RECORDED: "recorded",
} as const satisfies Record<string, LastSyncTimeState["status"]>;

const NEVER_SYNCED_TEXT = "Never";
const JUST_NOW_TEXT = "Just now";
const PERCENT_SUFFIX = "%";

export function format_relative_sync_time(
  command: FormatRelativeSyncTimeCommand,
): string {
  const { last_sync, relative_time_tick } = command;

  void relative_time_tick;

  switch (last_sync.status) {
    case LAST_SYNC_STATUS.NEVER:
      return NEVER_SYNCED_TEXT;
    case LAST_SYNC_STATUS.RECORDED:
      return format_elapsed_since_sync(new Date(last_sync.value));
  }
}

function format_elapsed_since_sync(last_sync_date: Date): string {
  const current_date = new Date();
  const elapsed_milliseconds =
    current_date.getTime() - last_sync_date.getTime();
  const elapsed_seconds = Math.floor(elapsed_milliseconds / 1000);
  const elapsed_minutes = Math.floor(elapsed_seconds / 60);
  const elapsed_hours = Math.floor(elapsed_minutes / 60);

  if (elapsed_seconds < 15) return JUST_NOW_TEXT;
  if (elapsed_seconds < 60) return `${elapsed_seconds}s ago`;
  if (elapsed_minutes < 60) return `${elapsed_minutes}m ago`;
  if (elapsed_hours < 24) return `${elapsed_hours}h ago`;

  return last_sync_date.toLocaleDateString();
}

export function format_sync_status_text(
  command: FormatSyncStatusTextCommand,
): string {
  if (command.sync_in_progress) {
    return `${command.current_percentage}${PERCENT_SUFFIX}`;
  }

  return format_relative_sync_time({
    last_sync: command.last_sync,
    relative_time_tick: command.relative_time_tick,
  });
}
