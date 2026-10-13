import { describe, expect, it, vi } from "vitest";

import { load_calendar_subscription_manager_data } from "./calendarSubscriptionManagerLogic";
import {
  create_calendar_token,
  create_competition,
  create_paginated_result,
  create_team,
} from "./calendarSubscriptionManagerLogic.test_support";

describe("load_calendar_subscription_manager_data", () => {
  it("loads subscription data when every lookup succeeds", async () => {
    const token = create_calendar_token();
    const team = create_team();
    const competition = create_competition();
    const use_cases = {
      calendar_token_use_cases: {
        list_user_feeds: vi.fn().mockResolvedValue({
          success: true,
          data: create_paginated_result([token]),
        }),
      },
      team_use_cases: {
        list: vi.fn().mockResolvedValue({
          success: true,
          data: create_paginated_result([team]),
        }),
      },
      competition_use_cases: {
        list: vi.fn().mockResolvedValue({
          success: true,
          data: create_paginated_result([competition]),
        }),
      },
    };

    const result = await load_calendar_subscription_manager_data({
      organization_id: "org_1",
      user_id: "user_1",
      use_cases: use_cases as never,
    });

    expect(result).toEqual({
      success: true,
      data: {
        existing_feeds: [token],
        teams: [team],
        competitions: [competition],
      },
    });
  });
});
