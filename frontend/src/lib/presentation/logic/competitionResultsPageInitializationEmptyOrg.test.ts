import { beforeEach, describe, expect, it, vi } from "vitest";

import { initialize_competition_results_page } from "./competitionResultsPageInitialization";

const { load_organizations_mock, load_competitions_mock } = vi.hoisted(() => ({
  load_organizations_mock: vi.fn(),
  load_competitions_mock: vi.fn(),
}));

vi.mock("$lib/presentation/logic/competitionResultsPageData", () => ({
  load_competition_results_organizations: load_organizations_mock,
}));

vi.mock(
  "$lib/presentation/logic/competitionResultsPageState",
  async (original) => ({
    ...(await original<object>()),
    load_competitions_for_results_organization: load_competitions_mock,
  }),
);

const EMPTY_ORG = { id: "org_empty", name: "A New Union" };
const BUSY_ORG = { id: "org_busy", name: "Uganda Hockey Association" };

function initialize(
  saved_organization_id: string,
): ReturnType<typeof initialize_competition_results_page> {
  return initialize_competition_results_page({
    current_profile_state: { status: "missing" },
    competition_results_dependencies: {} as never,
    url_params: { org_id: "", competition_id: "" },
    is_public: false,
    saved_organization_id,
    sync_public_organization: vi.fn(),
    load_public_data: vi.fn().mockResolvedValue({ success: true }),
  } as never);
}

describe("competition results opens on an organisation with competitions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    load_organizations_mock.mockResolvedValue([EMPTY_ORG, BUSY_ORG]);
    load_competitions_mock.mockImplementation(async (_deps, org_id) => ({
      competitions: org_id === BUSY_ORG.id ? [{ id: "c1" }] : [],
      selected_competition_id: org_id === BUSY_ORG.id ? "c1" : "",
      bundle: {},
    }));
  });

  it("skips an empty organisation when nothing was chosen before", async () => {
    const result = await initialize("");
    expect(result.selected_organization_id).toBe(BUSY_ORG.id);
    expect(result.selected_competition_id).toBe("c1");
  });

  it("keeps the organisation the viewer chose before, even when empty", async () => {
    const result = await initialize(EMPTY_ORG.id);
    expect(result.selected_organization_id).toBe(EMPTY_ORG.id);
  });
});
