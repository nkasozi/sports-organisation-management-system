import type { ConvexClient } from "convex/browser";

import { api } from "$convex/_generated/api";
import { LIVE_AUDIENCE_HEARTBEAT_MS } from "$convex/lib/live_audience_rules";
import type { LiveGameViewerStats } from "$convex/live_audience_stats";
import { read_realtime_convex_client } from "$lib/adapters/initialization/appInitializerRealtime";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "$lib/core/types/Option";
import {
  type LiveAudienceServerPort,
  type LiveAudienceSession,
  type LiveGameAudience,
  start_live_audience_session,
} from "$lib/infrastructure/liveAudience/liveAudienceSession";
import { read_device_viewer_key } from "$lib/infrastructure/liveAudience/liveAudienceViewerKey";

export type { LiveGameViewerStats } from "$convex/live_audience_stats";

const NO_STATS: LiveGameViewerStats = { status: "none" };
const STATS_LOAD_FAILED_EVENT = "live_audience_stats_load_failed";

function create_server_port(client: ConvexClient): LiveAudienceServerPort {
  return {
    report_presence: (fixture_id, viewer_key) =>
      client.mutation(api.live_audience.report_live_game_presence, {
        fixture_id,
        viewer_key,
      }),
    leave: (fixture_id, viewer_key) =>
      client.mutation(api.live_audience.leave_live_game, {
        fixture_id,
        viewer_key,
      }),
    watch_audience: (fixture_id, viewer_key, on_audience) => {
      const subscription = client.onUpdate(
        api.live_audience.get_live_game_audience,
        { fixture_id, viewer_key },
        on_audience,
      );
      return () => subscription.unsubscribe();
    },
  };
}

export function follow_live_game_audience(
  fixture_id: string,
  on_audience: (audience: LiveGameAudience) => void,
): Option<LiveAudienceSession> {
  const client = read_realtime_convex_client();
  if (client.status !== OptionStatus.SOME) return create_none_option();
  return create_some_option(
    start_live_audience_session({
      server: create_server_port(client.value),
      fixture_id,
      viewer_key: read_device_viewer_key(),
      heartbeat_ms: LIVE_AUDIENCE_HEARTBEAT_MS,
      on_audience,
    }),
  );
}

export async function load_live_game_viewer_stats(
  fixture_id: string,
): Promise<LiveGameViewerStats> {
  const client = read_realtime_convex_client();
  if (client.status !== OptionStatus.SOME) return NO_STATS;
  try {
    return await client.value.query(
      api.live_audience_stats.get_live_game_viewer_stats,
      { fixture_id },
    );
  } catch (error) {
    console.warn("[LiveAudience] Viewer stats could not be loaded", {
      event: STATS_LOAD_FAILED_EVENT,
      fixture_id,
      error: String(error),
    });
    return NO_STATS;
  }
}
