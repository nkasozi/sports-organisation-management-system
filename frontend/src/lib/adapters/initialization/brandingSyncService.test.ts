import { beforeEach, describe, expect, it, vi } from "vitest";

const branding_sync_service_mocks = vi.hoisted(() => {
  return {
    get_by_id: vi.fn(),
    set_organization_context: vi.fn(),
  };
});

vi.mock("$lib/infrastructure/registry/useCaseFactories", () => ({
  get_organization_use_cases: () => ({
    get_by_id: branding_sync_service_mocks.get_by_id,
  }),
}));

vi.mock("$lib/presentation/stores/branding", () => ({
  branding_store: {
    set_organization_context:
      branding_sync_service_mocks.set_organization_context,
  },
}));

describe("brandingSyncService", () => {
  beforeEach(() => {
    branding_sync_service_mocks.get_by_id.mockReset();
    branding_sync_service_mocks.set_organization_context.mockReset();
  });

  it("switches to platform branding when the profile state is missing", async () => {
    const { sync_branding_with_profile } =
      await import("./brandingSyncService");

    await expect(
      sync_branding_with_profile({ status: "missing" }),
    ).resolves.toBe(true);

    expect(
      branding_sync_service_mocks.set_organization_context,
    ).toHaveBeenCalledWith({ status: "platform" });
  });

  it("switches to platform branding when the profile has no organization scope", async () => {
    const { sync_branding_with_profile } =
      await import("./brandingSyncService");

    await expect(
      sync_branding_with_profile({
        status: "present",
        profile: {
          id: "public-viewer",
          display_name: "Public Viewer",
          email: "public.viewer@sport-sync.local",
          role: "public_viewer",
          organization_id: "*",
          organization_name: "",
          team_id: "*",
        },
      }),
    ).resolves.toBe(true);

    expect(
      branding_sync_service_mocks.set_organization_context,
    ).toHaveBeenCalledWith({ status: "platform" });
  });

  it("returns false and switches to platform branding when the organization cannot be loaded", async () => {
    branding_sync_service_mocks.get_by_id.mockResolvedValue({
      success: false,
      error: "Missing organization",
    });

    const { sync_branding_with_profile } =
      await import("./brandingSyncService");

    await expect(
      sync_branding_with_profile({
        status: "present",
        profile: {
          id: "profile-1",
          display_name: "Jane Doe",
          email: "jane@example.test",
          role: "org_admin",
          organization_id: "organization-1",
          organization_name: "City Hawks",
          team_id: "team-1",
        },
      }),
    ).resolves.toBe(false);

    expect(
      branding_sync_service_mocks.set_organization_context,
    ).toHaveBeenCalledWith({ status: "platform" });
  });

  it("applies scoped branding when the organization is available", async () => {
    branding_sync_service_mocks.get_by_id.mockResolvedValue({
      success: true,
      data: {
        id: "organization-1",
        name: "City Hawks",
        contact_email: "hawks@example.test",
        address: "1 Stadium Way",
      },
    });

    const { sync_branding_with_profile } =
      await import("./brandingSyncService");

    await expect(
      sync_branding_with_profile({
        status: "present",
        profile: {
          id: "profile-1",
          display_name: "Jane Doe",
          email: "jane@example.test",
          role: "org_admin",
          organization_id: "organization-1",
          organization_name: "City Hawks",
          team_id: "team-1",
        },
      }),
    ).resolves.toBe(true);

    expect(
      branding_sync_service_mocks.set_organization_context,
    ).toHaveBeenCalledWith({
      status: "scoped",
      organization_id: "organization-1",
      organization_name: "City Hawks",
      organization_email: "hawks@example.test",
      organization_address: "1 Stadium Way",
    });
  });
});
