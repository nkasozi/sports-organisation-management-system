import { describe, expect, it, vi } from "vitest";

const {
  create_activity_form_values_from_activity_mock,
  create_empty_activity_form_values_mock,
} = vi.hoisted(() => ({
  create_activity_form_values_from_activity_mock: vi.fn(),
  create_empty_activity_form_values_mock: vi.fn(),
}));

vi.mock("./calendarPageState", () => ({
  create_activity_form_values_from_activity:
    create_activity_form_values_from_activity_mock,
  create_empty_activity_form_values: create_empty_activity_form_values_mock,
}));

import { ANY_VALUE } from "$lib/core/interfaces/ports";

import {
  can_user_add_activities,
  can_user_change_organizations,
  create_activity_form_values_for_date,
  create_activity_form_values_for_date_time,
  extract_url_org_id,
  resolve_calendar_event_click,
  resolve_selected_organization_name,
} from "./calendarPageShellControllerHelpers";

describe("calendarPageShellControllerHelpers", () => {
  it("extracts organization ids and enforces organization-level activity access", () => {
    expect(extract_url_org_id(new URLSearchParams("org=org_1"))).toBe("org_1");
    expect(can_user_add_activities(null)).toBe(false);
    expect(
      can_user_add_activities({
        organization_id: ANY_VALUE,
        team_id: "",
      } as never),
    ).toBe(true);
    expect(
      can_user_add_activities({
        organization_id: "org_1",
        team_id: "team_1",
      } as never),
    ).toBe(false);
  });

  it("controls organization switching and resolves selected organization names", () => {
    expect(can_user_change_organizations(null, "")).toBe(true);
    expect(
      can_user_change_organizations(
        { organization_id: ANY_VALUE } as never,
        "org_1",
      ),
    ).toBe(true);
    expect(
      can_user_change_organizations(
        { organization_id: "org_1" } as never,
        "org_2",
      ),
    ).toBe(false);
    expect(
      resolve_selected_organization_name(
        [{ id: "org_1", name: "Uganda Hockey Association" }] as never[],
        "org_1",
      ),
    ).toBe("Uganda Hockey Association");
  });

  it("creates date-based form values and resolves event-click behavior", () => {
    create_empty_activity_form_values_mock.mockReturnValue({
      start_date: "",
      end_date: "",
      start_time: "",
      end_time: "",
    });
    create_activity_form_values_from_activity_mock.mockReturnValue({
      id: "form_1",
    });

    expect(create_activity_form_values_for_date("2026-04-08")).toEqual({
      start_date: "2026-04-08",
      end_date: "2026-04-08",
      start_time: "",
      end_time: "",
    });
    expect(
      create_activity_form_values_for_date_time("2026-04-08", "09:30"),
    ).toEqual({
      start_date: "2026-04-08",
      end_date: "2026-04-08",
      start_time: "09:30",
      end_time: "10:30",
    });

    expect(
      resolve_calendar_event_click({
        calendar_events: [],
        event_id: "missing",
      }),
    ).toEqual({
      editing_activity: null,
      selected_event_details: null,
      activity_form_values: null,
      show_create_modal: false,
    });

    const read_only_event = { id: "event_1", is_editable: false };
    expect(
      resolve_calendar_event_click({
        calendar_events: [read_only_event] as never[],
        event_id: "event_1",
      }),
    ).toEqual({
      editing_activity: null,
      selected_event_details: read_only_event,
      activity_form_values: null,
      show_create_modal: false,
    });

    expect(
      resolve_calendar_event_click({
        calendar_events: [
          { id: "event_2", is_editable: true, activity: { id: "activity_1" } },
        ] as never[],
        event_id: "event_2",
      }),
    ).toEqual({
      editing_activity: { id: "activity_1" },
      selected_event_details: null,
      activity_form_values: { id: "form_1" },
      show_create_modal: true,
    });
  });
});
