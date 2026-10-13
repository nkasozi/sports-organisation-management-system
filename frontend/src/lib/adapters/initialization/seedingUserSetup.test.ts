import { readable } from "svelte/store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { USER_WRITE_ORIGIN } from "../repositories/InBrowserRepositoryWriteOrigin";
import {
  load_and_set_current_user,
  seed_super_admin_user,
} from "./seedingUserSetup";

const mocks = vi.hoisted(() => ({
  user_state: { status: "missing" } as Record<string, unknown>,
  find_by_email: vi.fn(),
  set_user: vi.fn(),
  seed_with_data: vi.fn(),
}));

vi.mock("../../adapters/iam/clerkAuthService", () => ({
  get clerk_session() {
    return readable({ user_state: mocks.user_state });
  },
}));
vi.mock("../../infrastructure/container", () => ({
  get_repository_container: () => ({
    system_user_repository: { find_by_email: mocks.find_by_email },
  }),
}));
vi.mock("../../infrastructure/events/EventBus", () => ({
  EventBus: { emit_entity_created: vi.fn() },
  set_user_context: vi.fn(),
}));
vi.mock("../../presentation/stores/currentUser", () => ({
  current_user_store: { set_user: mocks.set_user },
}));
vi.mock("../repositories/InBrowserSystemUserRepository", () => ({
  get_system_user_repository: () => {
    const repository = {
      seed_with_data: mocks.seed_with_data,
      with_write_origin: () => repository,
    };
    return repository;
  },
}));
vi.mock("../../infrastructure/utils/SeedDataGenerator", () => ({
  SEED_SYSTEM_USER_IDS: { SYSTEM_ADMINISTRATOR: "admin-1" },
  create_seed_system_users: () => [{ id: "admin-1" }],
}));

const USER = {
  id: "user-1",
  email: "user@example.test",
  first_name: "Ann",
  last_name: "Lee",
  organization_id: "org-1",
  role: "org_admin",
};

describe("seedingUserSetup", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.user_state = {
      status: "present",
      user: { email_address: "User@Example.test" },
    };
    mocks.find_by_email.mockResolvedValue({
      success: true,
      data: { items: [USER] },
    });
    mocks.set_user.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fails without a Clerk session", async () => {
    mocks.user_state = { status: "missing" };
    const result = await load_and_set_current_user();
    expect(result).toEqual({
      success: false,
      error: "No Clerk session active",
    });
  });

  it("resolves the current user without logging the email", async () => {
    const result = await load_and_set_current_user();
    expect(result).toEqual({ success: true, data: USER });
    expect(mocks.set_user).toHaveBeenCalledWith(USER);
    expect(JSON.stringify(vi.mocked(console.log).mock.calls)).not.toContain(
      USER.email,
    );
  });

  it("returns a user-safe failure when no system user matches", async () => {
    mocks.find_by_email.mockResolvedValue({
      success: true,
      data: { items: [] },
    });
    const result = await load_and_set_current_user();
    expect(result).toEqual({
      success: false,
      error: "Your user account is not available on this device yet",
    });
  });

  it("fails and logs when the current user store rejects", async () => {
    mocks.set_user.mockRejectedValue(new Error("store exploded"));
    const result = await load_and_set_current_user();
    expect(result).toEqual({
      success: false,
      error: "Failed to load your user account",
    });
    expect(console.error).toHaveBeenCalledWith(
      "[Seeding] Failed to set current user",
      expect.objectContaining({
        event: "seeding_set_user_failed",
        error_code: "initialization_set_current_user_failed",
        user_id: "user-1",
      }),
    );
  });

  it("fails super admin seeding when the repository write fails", async () => {
    mocks.seed_with_data.mockResolvedValue({ success: false, error: "x" });
    const result = await seed_super_admin_user(USER_WRITE_ORIGIN);
    expect(result).toEqual({
      success: false,
      error: "Failed to seed super admin user",
    });
  });

  it("returns the seeded super admin", async () => {
    mocks.seed_with_data.mockResolvedValue({ success: true, data: 1 });
    const result = await seed_super_admin_user(USER_WRITE_ORIGIN);
    expect(result).toEqual({ success: true, data: { id: "admin-1" } });
  });
});
