import { beforeEach, describe, expect, it, vi } from "vitest";

import { generate_token_for_profile } from "./authHelpers";

const { generate_token_mock, get_authentication_adapter_mock } = vi.hoisted(
  () => ({
    generate_token_mock: vi.fn(),
    get_authentication_adapter_mock: vi.fn(),
  }),
);

vi.mock("$lib/adapters/iam/LocalAuthenticationAdapter", () => ({
  get_authentication_adapter: get_authentication_adapter_mock,
}));

vi.mock("$lib/adapters/repositories/InBrowserSystemUserRepository", () => ({
  get_system_user_repository: vi.fn(() => ({ repository: "system_user" })),
}));

describe("token team scope", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    get_authentication_adapter_mock.mockReturnValue({
      generate_token: generate_token_mock,
    });
  });

  it("signs users who aren't tied to a team in with an all-teams scope", async () => {
    const profile = {
      id: "profile_2",
      email: "official@example.com",
      display_name: "Grace Akello",
      role: "official",
      organization_id: "org_1",
      team_id: "",
    } as never;
    generate_token_mock.mockResolvedValueOnce({
      success: true,
      data: { raw_token: "official.token.sig" },
    });

    await expect(generate_token_for_profile(profile)).resolves.toEqual({
      success: true,
      data: { raw_token: "official.token.sig" },
    });
    expect(generate_token_mock).toHaveBeenCalledWith(
      expect.objectContaining({ organization_id: "org_1", team_id: "*" }),
    );
  });
});
