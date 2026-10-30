import {
  create_none_option,
  create_some_option,
  type Option,
} from "$lib/core/types/Option";
import type { LiveGameAudience } from "$lib/infrastructure/liveAudience/liveAudienceSession";

import type { LiveGameViewerStats } from "./liveAudienceRuntime";

export interface AudienceFace {
  key: string;
  initial: string;
  name: string;
  color_index: number;
  is_you: boolean;
}

export interface AudienceDisplay {
  headline: string;
  faces: AudienceFace[];
  hidden_count: number;
}

const YOU_FACE: AudienceFace = {
  key: "you",
  initial: "You",
  name: "You",
  color_index: 0,
  is_you: true,
};
const ANONYMOUS_PREFIX = "Anonymous ";

function describe_watching(watching_now: number, is_counted: boolean): string {
  if (watching_now === 0) return "Connecting to the live audience…";
  if (watching_now === 1 && is_counted) return "Only you are watching";
  if (watching_now === 1) return "1 person watching now";
  return `${watching_now} people watching now`;
}

export function build_audience_display(
  audience: LiveGameAudience,
): AudienceDisplay {
  const other_faces = audience.other_faces.map((face, index) => ({
    key: `${face.name}-${index}`,
    initial: face.name.replace(ANONYMOUS_PREFIX, "").charAt(0),
    name: face.name,
    color_index: face.color_index,
    is_you: false,
  }));
  const faces = audience.is_viewer_counted
    ? [YOU_FACE, ...other_faces]
    : other_faces;
  return {
    headline: describe_watching(
      audience.watching_now,
      audience.is_viewer_counted,
    ),
    faces,
    hidden_count: Math.max(0, audience.watching_now - faces.length),
  };
}

function describe_watch_time(total_minutes: number): string {
  const hours = Math.floor(total_minutes / 60);
  const minutes = total_minutes % 60;
  if (hours === 0) return `${minutes} min`;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

export interface ViewerStatsSummary {
  followed_live: string;
  peak: string;
  watch_time: string;
}

export function summarize_viewer_stats(
  stats: Extract<LiveGameViewerStats, { status: "present" }>,
): ViewerStatsSummary {
  const people = stats.unique_viewers === 1 ? "person" : "people";
  return {
    followed_live: `${stats.unique_viewers} ${people} followed live`,
    peak: `${stats.peak_viewers} watching at the busiest moment`,
    watch_time: `${describe_watch_time(stats.total_watch_minutes)} watched in total`,
  };
}

const VIEWER_STATS_STATUS = {
  NONE: "none",
  PRESENT: "present",
} as const;

export function summarize_loaded_viewer_stats(
  stats: LiveGameViewerStats,
): Option<ViewerStatsSummary> {
  switch (stats.status) {
    case VIEWER_STATS_STATUS.PRESENT:
      return create_some_option(summarize_viewer_stats(stats));
    case VIEWER_STATS_STATUS.NONE:
      return create_none_option();
  }
}
