import { describe, expect, it, vi, beforeEach } from "vitest";

let mock_is_signed_in = false;

vi.mock("../repositories/InBrowserOrganizationRepository", () => ({
  reset_organization_repository: vi.fn().mockResolvedValue(undefined),
  get_organization_repository: vi.fn(),
}));
vi.mock("../repositories/InBrowserTeamRepository", () => ({
  reset_team_repository: vi.fn().mockResolvedValue(undefined),
  get_team_repository: vi.fn(),
}));
vi.mock("../repositories/InBrowserCompetitionRepository", () => ({
  reset_competition_repository: vi.fn().mockResolvedValue(undefined),
  get_competition_repository: vi.fn(),
}));
vi.mock("../repositories/InBrowserPlayerRepository", () => ({
  reset_player_repository: vi.fn().mockResolvedValue(undefined),
  get_player_repository: vi.fn(),
}));
vi.mock("../repositories/InBrowserPlayerTeamMembershipRepository", () => ({
  reset_player_team_membership_repository: vi.fn().mockResolvedValue(undefined),
  get_player_team_membership_repository: vi.fn(),
}));
vi.mock("../repositories/InBrowserOfficialRepository", () => ({
  reset_official_repository: vi.fn().mockResolvedValue(undefined),
  get_official_repository: vi.fn(),
}));
vi.mock("../repositories/InBrowserSportRepository", () => ({
  reset_sport_repository: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../repositories/InBrowserFixtureRepository", () => ({
  reset_fixture_repository: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../repositories/InBrowserTeamStaffRepository", () => ({
  reset_team_staff_repository: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../repositories/InBrowserGameEventTypeRepository", () => ({
  reset_game_event_type_repository: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../repositories/InBrowserPlayerPositionRepository", () => ({
  reset_player_position_repository: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../repositories/InBrowserTeamStaffRoleRepository", () => ({
  reset_team_staff_role_repository: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../repositories/InBrowserGameOfficialRoleRepository", () => ({
  reset_game_official_role_repository: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../repositories/InBrowserCompetitionFormatRepository", () => ({
  reset_competition_format_repository: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../repositories/InBrowserVenueRepository", () => ({
  reset_venue_repository: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../repositories/InBrowserJerseyColorRepository", () => ({
  reset_jersey_color_repository: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../repositories/InBrowserCompetitionTeamRepository", () => ({
  reset_competition_team_repository: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../repositories/InBrowserPlayerProfileRepository", () => ({
  reset_player_profile_repository: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../repositories/InBrowserTeamProfileRepository", () => ({
  reset_team_profile_repository: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../repositories/InBrowserProfileLinkRepository", () => ({
  reset_profile_link_repository: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../repositories/InBrowserQualificationRepository", () => ({
  reset_qualification_repository: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../repositories/InBrowserFixtureDetailsSetupRepository", () => ({
  reset_fixture_details_setup_repository: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../repositories/InBrowserFixtureLineupRepository", () => ({
  reset_fixture_lineup_repository: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../persistence/sportService", () => ({
  get_all_sports: vi.fn().mockResolvedValue([]),
}));
vi.mock("./seedingService", () => ({
  seed_all_data_if_needed: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("$lib/infrastructure/sync/convexSyncService", () => ({
  clear_all_demo_data_in_convex: vi.fn().mockResolvedValue(true),
}));
vi.mock("$lib/infrastructure/sync/backgroundSyncService", () => ({
  stop_background_sync: vi.fn().mockReturnValue(true),
  start_background_sync: vi.fn().mockReturnValue(true),
  set_pulling_from_remote: vi.fn(),
}));
vi.mock("$lib/presentation/stores/initialSyncStore", () => ({
  clear_session_sync_flag: vi.fn(),
}));
vi.mock("$lib/adapters/iam/clerkAuthService", () => ({
  is_signed_in: {
    subscribe: (fn: (value: boolean) => void) => {
      fn(mock_is_signed_in);
      return () => {};
    },
  },
}));

const mock_app_settings_store: Record<string, string> = {};
const mock_clear_all_settings = vi.fn(() => {
  Object.keys(mock_app_settings_store).forEach(
    (k) => delete mock_app_settings_store[k],
  );
  return Promise.resolve();
});

vi.mock("$lib/infrastructure/container", () => ({
  get_app_settings_storage: () => ({
    get_setting: (key: string) =>
      Promise.resolve(mock_app_settings_store[key] ?? null),
    set_setting: (key: string, value: string) => {
      mock_app_settings_store[key] = value;
      return Promise.resolve();
    },
    remove_setting: (key: string) => {
      delete mock_app_settings_store[key];
      return Promise.resolve();
    },
    clear_all_settings: mock_clear_all_settings,
  }),
}));

import { reset_all_data } from "./dataResetService";
import { clear_all_demo_data_in_convex } from "$lib/infrastructure/sync/convexSyncService";
import {
  stop_background_sync,
  start_background_sync,
  set_pulling_from_remote,
} from "$lib/infrastructure/sync/backgroundSyncService";
import { clear_session_sync_flag } from "$lib/presentation/stores/initialSyncStore";
import { seed_all_data_if_needed } from "./seedingService";
import { reset_sport_repository } from "../repositories/InBrowserSportRepository";
import { reset_organization_repository } from "../repositories/InBrowserOrganizationRepository";

describe("reset_all_data", () => {
  const setup_window = () => {
    (globalThis as Record<string, unknown>).window = globalThis;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mock_clear_all_settings.mockClear();
    Object.keys(mock_app_settings_store).forEach(
      (k) => delete mock_app_settings_store[k],
    );
    mock_is_signed_in = false;
    setup_window();
  });

  it("returns false when window is undefined (SSR guard)", async () => {
    const original_window = (globalThis as Record<string, unknown>).window;
    delete (globalThis as Record<string, unknown>).window;

    const result = await reset_all_data();

    expect(result).toBe(false);

    (globalThis as Record<string, unknown>).window = original_window;
  });

  it("returns true on a successful reset", async () => {
    const result = await reset_all_data();
    expect(result).toBe(true);
  });

  it("stops background sync before doing anything else", async () => {
    const call_order: string[] = [];
    vi.mocked(stop_background_sync).mockImplementation(() => {
      call_order.push("stop");
      return true;
    });
    vi.mocked(reset_sport_repository).mockImplementation(async () => {
      call_order.push("reset_sport");
    });

    await reset_all_data();

    expect(call_order.indexOf("stop")).toBeLessThan(
      call_order.indexOf("reset_sport"),
    );
  });

  it("sets pulling_from_remote to true before resetting and false after", async () => {
    const call_order: string[] = [];
    vi.mocked(set_pulling_from_remote).mockImplementation((value: boolean) => {
      call_order.push(value ? "pulling_true" : "pulling_false");
    });
    vi.mocked(seed_all_data_if_needed).mockImplementation(async () => {
      call_order.push("seeding");
      return { success: true as const, data: true };
    });

    await reset_all_data();

    expect(call_order[0]).toBe("pulling_true");
    const pulling_false_index = call_order.lastIndexOf("pulling_false");
    const seeding_index = call_order.indexOf("seeding");
    expect(pulling_false_index).toBeGreaterThan(seeding_index);
  });

  it("clears the server data when user is signed in", async () => {
    mock_is_signed_in = true;

    await reset_all_data();

    expect(clear_all_demo_data_in_convex).toHaveBeenCalledOnce();
  });

  it("skips clearing server data when user is not signed in", async () => {
    mock_is_signed_in = false;

    await reset_all_data();

    expect(clear_all_demo_data_in_convex).not.toHaveBeenCalled();
  });

  it("clears all app settings via the settings port", async () => {
    await reset_all_data();
    expect(mock_clear_all_settings).toHaveBeenCalledOnce();
  });

  it("clears the session sync flag so post-reload runs a full initial sync", async () => {
    await reset_all_data();
    expect(clear_session_sync_flag).toHaveBeenCalledOnce();
  });

  it("clears the session sync flag even when user is not signed in", async () => {
    mock_is_signed_in = false;
    await reset_all_data();
    expect(clear_session_sync_flag).toHaveBeenCalledOnce();
  });

  it("re-seeds default data after clearing repositories", async () => {
    const call_order: string[] = [];
    vi.mocked(reset_organization_repository).mockImplementation(async () => {
      call_order.push("reset_org");
    });
    vi.mocked(seed_all_data_if_needed).mockImplementation(async () => {
      call_order.push("seed");
      return { success: true as const, data: true };
    });

    await reset_all_data();

    expect(call_order.indexOf("reset_org")).toBeLessThan(
      call_order.indexOf("seed"),
    );
  });

  it("starts background sync after reset when user is signed in", async () => {
    mock_is_signed_in = true;

    await reset_all_data();

    expect(start_background_sync).toHaveBeenCalledOnce();
  });

  it("does not start background sync when user is not signed in", async () => {
    mock_is_signed_in = false;

    await reset_all_data();

    expect(start_background_sync).not.toHaveBeenCalled();
  });

  it("reports progress milestones via the callback", async () => {
    const reported_steps: Array<{ message: string; percentage: number }> = [];

    await reset_all_data((message, percentage) => {
      reported_steps.push({ message, percentage });
    });

    expect(reported_steps.length).toBeGreaterThan(0);
    expect(reported_steps[0].percentage).toBeLessThanOrEqual(10);
    const last_step = reported_steps[reported_steps.length - 1];
    expect(last_step.percentage).toBeGreaterThanOrEqual(90);
  });

  it("reports progress in ascending order", async () => {
    const percentages: number[] = [];

    await reset_all_data((_message, percentage) => {
      percentages.push(percentage);
    });

    for (let i = 1; i < percentages.length; i++) {
      expect(percentages[i]).toBeGreaterThanOrEqual(percentages[i - 1]);
    }
  });

  it("works without a progress callback (no crash)", async () => {
    const result = await reset_all_data();
    expect(result).toBe(true);
  });
});
