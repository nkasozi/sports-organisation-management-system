import type { Activity } from "../../core/entities/Activity";
import type { CalendarEvent } from "../../core/interfaces/ports/ActivityUseCasesPort";

export interface GoogleCalendarConfig {
  client_id: string;
  api_key: string;
  scopes: string[];
}

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  colorId?: string;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: string; minutes: number }>;
  };
}

export interface GoogleCalendarSyncResult {
  success: boolean;
  synced_count: number;
  failed_count: number;
  errors: string[];
}

export interface GoogleCalendarAuthStatus {
  is_signed_in: boolean;
  user_email?: string;
}

const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

const DISCOVERY_DOC =
  "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";

let google_api_loaded = false;
let gis_loaded = false;
let token_client: any = null;
let access_token: string | null = null;

export function get_google_calendar_config(): GoogleCalendarConfig {
  return {
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
    api_key: import.meta.env.VITE_GOOGLE_API_KEY || "",
    scopes: GOOGLE_CALENDAR_SCOPES,
  };
}

export function is_google_calendar_configured(): boolean {
  const config = get_google_calendar_config();
  return config.client_id.length > 0 && config.api_key.length > 0;
}

async function load_google_api_script(): Promise<boolean> {
  if (google_api_loaded) return true;

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      google_api_loaded = true;
      resolve(true);
    };
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

async function load_gis_script(): Promise<boolean> {
  if (gis_loaded) return true;

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      gis_loaded = true;
      resolve(true);
    };
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export async function initialize_google_calendar(): Promise<boolean> {
  if (!is_google_calendar_configured()) {
    console.warn(
      "Google Calendar is not configured. Please set VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_API_KEY.",
    );
    return false;
  }

  const config = get_google_calendar_config();

  const api_loaded = await load_google_api_script();
  const gis_loaded_result = await load_gis_script();

  if (!api_loaded || !gis_loaded_result) {
    console.error("Failed to load Google API scripts");
    return false;
  }

  return new Promise((resolve) => {
    (window as any).gapi.load("client", async () => {
      try {
        await (window as any).gapi.client.init({
          apiKey: config.api_key,
          discoveryDocs: [DISCOVERY_DOC],
        });

        token_client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: config.client_id,
          scope: config.scopes.join(" "),
          callback: (response: any) => {
            if (response.access_token) {
              access_token = response.access_token;
            }
          },
        });

        resolve(true);
      } catch (error) {
        console.error("Failed to initialize Google Calendar:", error);
        resolve(false);
      }
    });
  });
}

export async function sign_in_to_google_calendar(): Promise<GoogleCalendarAuthStatus> {
  if (!token_client) {
    const initialized = await initialize_google_calendar();
    if (!initialized) {
      return { is_signed_in: false };
    }
  }

  return new Promise((resolve) => {
    token_client.callback = async (response: any) => {
      if (response.error) {
        resolve({ is_signed_in: false });
        return;
      }

      access_token = response.access_token;

      try {
        const user_info_response = await fetch(
          "https://www.googleapis.com/oauth2/v2/userinfo",
          {
            headers: { Authorization: `Bearer ${access_token}` },
          },
        );
        const user_info = await user_info_response.json();

        resolve({
          is_signed_in: true,
          user_email: user_info.email,
        });
      } catch {
        resolve({ is_signed_in: true });
      }
    };

    if (access_token === null) {
      token_client.requestAccessToken({ prompt: "consent" });
    } else {
      token_client.requestAccessToken({ prompt: "" });
    }
  });
}

export function sign_out_of_google_calendar(): void {
  if (access_token) {
    (window as any).google.accounts.oauth2.revoke(access_token);
    access_token = null;
  }
}

export function is_signed_in_to_google(): boolean {
  return access_token !== null;
}

function convert_activity_to_google_event(
  activity: Activity,
): GoogleCalendarEvent {
  const start = activity.is_all_day
    ? { date: activity.start_datetime.split("T")[0] }
    : {
        dateTime: activity.start_datetime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

  const end = activity.is_all_day
    ? { date: activity.end_datetime.split("T")[0] }
    : {
        dateTime: activity.end_datetime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

  const google_event: GoogleCalendarEvent = {
    summary: activity.title,
    description: activity.description || activity.notes || "",
    location: activity.location || undefined,
    start,
    end,
  };

  const enabled_reminders = activity.reminders.filter((r) => r.is_enabled);
  if (enabled_reminders.length > 0) {
    google_event.reminders = {
      useDefault: false,
      overrides: enabled_reminders.map((r) => ({
        method: "popup",
        minutes: r.minutes_before,
      })),
    };
  }

  return google_event;
}

export async function sync_activity_to_google_calendar(
  activity: Activity,
): Promise<{ success: boolean; google_event_id?: string; error?: string }> {
  if (!is_signed_in_to_google()) {
    return { success: false, error: "Not signed in to Google Calendar" };
  }

  const google_event = convert_activity_to_google_event(activity);

  try {
    if (activity.google_calendar_event_id) {
      const response = await (window as any).gapi.client.calendar.events.update(
        {
          calendarId: "primary",
          eventId: activity.google_calendar_event_id,
          resource: google_event,
        },
      );

      return { success: true, google_event_id: response.result.id };
    } else {
      const response = await (window as any).gapi.client.calendar.events.insert(
        {
          calendarId: "primary",
          resource: google_event,
        },
      );

      return { success: true, google_event_id: response.result.id };
    }
  } catch (error: any) {
    console.error("Failed to sync activity to Google Calendar:", error);
    return {
      success: false,
      error:
        error.result?.error?.message || "Failed to sync with Google Calendar",
    };
  }
}

export async function delete_activity_from_google_calendar(
  google_event_id: string,
): Promise<{ success: boolean; error?: string }> {
  if (!is_signed_in_to_google()) {
    return { success: false, error: "Not signed in to Google Calendar" };
  }

  try {
    await (window as any).gapi.client.calendar.events.delete({
      calendarId: "primary",
      eventId: google_event_id,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete event from Google Calendar:", error);
    return {
      success: false,
      error:
        error.result?.error?.message || "Failed to delete from Google Calendar",
    };
  }
}

export async function sync_multiple_activities_to_google(
  activities: Activity[],
): Promise<GoogleCalendarSyncResult> {
  const result: GoogleCalendarSyncResult = {
    success: true,
    synced_count: 0,
    failed_count: 0,
    errors: [],
  };

  for (const activity of activities) {
    if (!activity.google_calendar_sync_enabled) {
      continue;
    }

    const sync_result = await sync_activity_to_google_calendar(activity);

    if (sync_result.success) {
      result.synced_count++;
    } else {
      result.failed_count++;
      result.errors.push(`${activity.title}: ${sync_result.error}`);
    }
  }

  result.success = result.failed_count === 0;
  return result;
}

export async function fetch_google_calendar_events(
  start_date: string,
  end_date: string,
): Promise<{
  success: boolean;
  events?: GoogleCalendarEvent[];
  error?: string;
}> {
  if (!is_signed_in_to_google()) {
    return { success: false, error: "Not signed in to Google Calendar" };
  }

  try {
    const response = await (window as any).gapi.client.calendar.events.list({
      calendarId: "primary",
      timeMin: new Date(start_date).toISOString(),
      timeMax: new Date(end_date).toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 500,
    });

    return { success: true, events: response.result.items || [] };
  } catch (error: any) {
    console.error("Failed to fetch Google Calendar events:", error);
    return {
      success: false,
      error: error.result?.error?.message || "Failed to fetch events",
    };
  }
}
