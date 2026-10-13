import { PUBLIC_CONVEX_URL } from "$env/static/public";

import type { RequestHandler } from "./$types";
import { create_convex_calendar_feed_data_source } from "./calendarFeedDataSource";
import { serve_calendar_feed } from "./calendarFeedResponder";

export const GET: RequestHandler = async ({ params }) =>
  serve_calendar_feed(
    create_convex_calendar_feed_data_source(PUBLIC_CONVEX_URL),
    params.token,
  );
