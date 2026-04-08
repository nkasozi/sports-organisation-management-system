import { get } from "svelte/store";
import { beforeEach, describe, expect, it, vi } from "vitest";

const public_organization_mocks = vi.hoisted(() => ({
  get_setting: vi.fn(),
  set_setting: vi.fn(),
  remove_setting: vi.fn(),
}));

vi.mock("$app/environment", () => ({
  browser: true,
}));

vi.mock("$lib/infrastructure/container", () => ({
  get_app_settings_storage: () => ({
    get_setting: public_organization_mocks.get_setting,
    set_setting: public_organization_mocks.set_setting,
    remove_setting: public_organization_mocks.remove_setting,
  }),
}));

import { public_organization_store } from "./publicOrganization";

describe("publicOrganization", () => {
  beforeEach(async () => {
    public_organization_mocks.get_setting.mockReset();
    public_organization_mocks.set_setting.mockReset();
    public_organization_mocks.remove_setting.mockReset();
    await public_organization_store.clear();
    public_organization_mocks.remove_setting.mockReset();
  });

  it("loads the saved public organization on initialization", async () => {
    public_organization_mocks.get_setting
      .mockResolvedValueOnce("organization-1")
      .mockResolvedValueOnce("City Hawks");

    await public_organization_store.initialize();

    expect(get(public_organization_store)).toEqual({
      organization_id: "organization-1",
      organization_name: "City Hawks",
    });
    expect(public_organization_mocks.get_setting).toHaveBeenNthCalledWith(
      1,
      "sports-org-public-org-id",
    );
    expect(public_organization_mocks.get_setting).toHaveBeenNthCalledWith(
      2,
      "sports-org-public-org-name",
    );
  });

  it("persists the selected organization and clears it when requested", async () => {
    expect(
      await public_organization_store.set_organization(
        "organization-2",
        "Northern Lions",
      ),
    ).toBe(true);
    expect(get(public_organization_store)).toEqual({
      organization_id: "organization-2",
      organization_name: "Northern Lions",
    });
    expect(public_organization_mocks.set_setting).toHaveBeenNthCalledWith(
      1,
      "sports-org-public-org-id",
      "organization-2",
    );
    expect(public_organization_mocks.set_setting).toHaveBeenNthCalledWith(
      2,
      "sports-org-public-org-name",
      "Northern Lions",
    );

    expect(await public_organization_store.clear()).toBe(true);
    expect(get(public_organization_store)).toEqual({
      organization_id: "",
      organization_name: "",
    });
    expect(public_organization_mocks.remove_setting).toHaveBeenNthCalledWith(
      1,
      "sports-org-public-org-id",
    );
    expect(public_organization_mocks.remove_setting).toHaveBeenNthCalledWith(
      2,
      "sports-org-public-org-name",
    );
  });

  it("detects organization IDs from URL params and ignores missing values", async () => {
    expect(
      await public_organization_store.detect_from_url_params(
        new URLSearchParams(),
      ),
    ).toBe(false);
    expect(public_organization_mocks.set_setting).not.toHaveBeenCalled();

    expect(
      await public_organization_store.detect_from_url_params(
        new URLSearchParams("org=public-org"),
      ),
    ).toBe(true);
    expect(get(public_organization_store)).toEqual({
      organization_id: "public-org",
      organization_name: "",
    });
  });
});
