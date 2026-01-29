import type { RequestHandler } from "./$types";
import {
  get_use_cases_container,
  get_repository_container,
} from "$lib/infrastructure/container";
import {
  generate_ical_feed,
  convert_activity_to_ical_event,
  type ICalEvent,
  type ICalFeedConfig,
} from "$lib/core/services/ICalService";
import { get_feed_type_display_name } from "$lib/core/entities/CalendarToken";

export const GET: RequestHandler = async ({ params }) => {
  const token_with_extension = params.token;
  const token = token_with_extension.replace(/\.ics$/, "");

  const use_cases = get_use_cases_container();
  const repositories = get_repository_container();

  const token_result =
    await use_cases.calendar_token_use_cases.get_feed_by_token(token);

  if (!token_result.success || !token_result.data) {
    return new Response("Calendar feed not found or inactive", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const calendar_token = token_result.data;

  await use_cases.calendar_token_use_cases.record_feed_access(token);

  const organization_result =
    await repositories.organization_repository.find_by_id(
      calendar_token.organization_id,
    );

  const organization_name =
    organization_result.success && organization_result.data
      ? organization_result.data.name
      : "Sports Organisation";

  const current_year = new Date().getFullYear();
  const start_date = `${current_year}-01-01`;
  const end_date = `${current_year}-12-31`;

  let activities_result =
    await repositories.activity_repository.find_by_date_range(
      calendar_token.organization_id,
      start_date,
      end_date,
      { page_number: 1, page_size: 1000 },
    );

  let activities =
    activities_result.success && activities_result.data?.items
      ? activities_result.data.items
      : [];

  if (calendar_token.feed_type === "team" && calendar_token.entity_id) {
    activities = activities.filter((activity) =>
      activity.team_ids.includes(calendar_token.entity_id!),
    );
  } else if (
    calendar_token.feed_type === "competition" &&
    calendar_token.entity_id
  ) {
    activities = activities.filter(
      (activity) => activity.competition_id === calendar_token.entity_id,
    );
  }

  const ical_events: ICalEvent[] = activities.map((activity) =>
    convert_activity_to_ical_event(activity, organization_name),
  );

  let feed_name = `${organization_name} Calendar`;
  if (calendar_token.feed_type !== "all") {
    const type_display = get_feed_type_display_name(calendar_token.feed_type);
    feed_name = calendar_token.entity_name
      ? `${calendar_token.entity_name} - ${type_display}`
      : `${organization_name} ${type_display}`;
  }

  const config: ICalFeedConfig = {
    feed_name,
    organization_name,
    timezone: "UTC",
    reminder_minutes_before: calendar_token.reminder_minutes_before,
  };

  const ics_content = generate_ical_feed(ical_events, config);

  return new Response(ics_content, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${feed_name.replace(/[^a-zA-Z0-9]/g, "_")}.ics"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
};
