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

function initialize(command: {
  is_public: boolean;
  org_id?: string;
  load_public_data: (organization_id: string) => Promise<{ success: boolean }>;
}): ReturnType<typeof initialize_competition_results_page> {
  return initialize_competition_results_page({
    current_profile_state: { status: "missing" },
    competition_results_dependencies: {} as never,
    url_params: { org_id: command.org_id ?? "", competition_id: "" },
    is_public: command.is_public,
    saved_organization_id: "",
    sync_public_organization: vi.fn(),
    load_public_data: command.load_public_data,
  } as never);
}

describe("public visitors with no organization link see real competitions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    load_organizations_mock.mockResolvedValue([EMPTY_ORG, BUSY_ORG]);
    load_competitions_mock.mockImplementation(async (_deps, org_id) => ({
      competitions: org_id === BUSY_ORG.id ? [{ id: "c1" }] : [],
      selected_competition_id: org_id === BUSY_ORG.id ? "c1" : "",
      bundle: {},
    }));
  });

  it("fetches each organization's data before looking for its competitions", async () => {
    const load_public_data = vi.fn().mockResolvedValue({ success: true });

    const result = await initialize({ is_public: true, load_public_data });

    expect(result.selected_organization_id).toBe(BUSY_ORG.id);
    expect(load_public_data.mock.calls).toEqual([
      [""],
      [EMPTY_ORG.id],
      [BUSY_ORG.id],
    ]);
  });

  it("does not fetch the organization from the link twice", async () => {
    const load_public_data = vi.fn().mockResolvedValue({ success: true });

    await initialize({
      is_public: true,
      org_id: "org_missing",
      load_public_data,
    });

    expect(load_public_data.mock.calls[0]).toEqual(["org_missing"]);
    expect(
      load_public_data.mock.calls.filter(([id]) => id === "org_missing"),
    ).toHaveLength(1);
  });

  it("does not fetch public data per organization for a signed-in member", async () => {
    const load_public_data = vi.fn().mockResolvedValue({ success: true });

    await initialize({ is_public: false, load_public_data });

    expect(load_public_data.mock.calls).toEqual([[""]]);
  });
});
