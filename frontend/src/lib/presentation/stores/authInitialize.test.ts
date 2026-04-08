import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth_initialize_mocks = vi.hoisted(() => {
  let signed_in_value = false;
  const subscribers = new Set<(value: boolean) => void>();

  return {
    set_signed_in: (next_value: boolean): void => {
      signed_in_value = next_value;
      subscribers.forEach((subscriber) => subscriber(signed_in_value));
    },
    is_signed_in: {
      subscribe(subscriber: (value: boolean) => void): () => void {
        subscriber(signed_in_value);
        subscribers.add(subscriber);
        return () => subscribers.delete(subscriber);
      },
    },
    sync_branding_with_profile: vi.fn(),
    generate_token_for_profile: vi.fn(),
    load_saved_token: vi.fn(),
    load_sidebar_menu_for_role: vi.fn(),
    save_profile_id: vi.fn(),
    save_token: vi.fn(),
    sync_user_context_with_event_bus: vi.fn(),
    create_default_anonymous_state: vi.fn(),
    get_clerk_email: vi.fn(),
    load_available_profiles: vi.fn(),
    try_restore_anonymous_session: vi.fn(),
    try_restore_signed_in_session: vi.fn(),
    wait_for_clerk: vi.fn(),
  };
});

vi.mock("$lib/adapters/iam/clerkAuthService", () => ({
  is_signed_in: auth_initialize_mocks.is_signed_in,
}));

vi.mock("$lib/adapters/initialization/brandingSyncService", () => ({
  sync_branding_with_profile: auth_initialize_mocks.sync_branding_with_profile,
}));

vi.mock("./authHelpers", () => ({
  generate_token_for_profile: auth_initialize_mocks.generate_token_for_profile,
  load_saved_token: auth_initialize_mocks.load_saved_token,
  load_sidebar_menu_for_role: auth_initialize_mocks.load_sidebar_menu_for_role,
  save_profile_id: auth_initialize_mocks.save_profile_id,
  save_token: auth_initialize_mocks.save_token,
  sync_user_context_with_event_bus:
    auth_initialize_mocks.sync_user_context_with_event_bus,
}));

vi.mock("./authInitializationHelpers", () => ({
  create_default_anonymous_state:
    auth_initialize_mocks.create_default_anonymous_state,
  get_clerk_email: auth_initialize_mocks.get_clerk_email,
  load_available_profiles: auth_initialize_mocks.load_available_profiles,
  try_restore_anonymous_session:
    auth_initialize_mocks.try_restore_anonymous_session,
  try_restore_signed_in_session:
    auth_initialize_mocks.try_restore_signed_in_session,
  wait_for_clerk: auth_initialize_mocks.wait_for_clerk,
}));

function build_profile(
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    id: "profile-1",
    display_name: "Jane Doe",
    email: "jane@example.test",
    role: "org_admin",
    organization_id: "organization-1",
    organization_name: "City Hawks",
    team_id: "team-1",
    ...overrides,
  };
}

function build_auth_state(
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    current_token: null,
    current_profile: null,
    available_profiles: [],
    sidebar_menu_items: [],
    is_initialized: false,
    is_demo_session: false,
    ...overrides,
  };
}

describe("authInitialize", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    auth_initialize_mocks.set_signed_in(false);
    auth_initialize_mocks.sync_branding_with_profile.mockReset();
    auth_initialize_mocks.generate_token_for_profile.mockReset();
    auth_initialize_mocks.load_saved_token.mockReset();
    auth_initialize_mocks.load_sidebar_menu_for_role.mockReset();
    auth_initialize_mocks.save_profile_id.mockReset();
    auth_initialize_mocks.save_token.mockReset();
    auth_initialize_mocks.sync_user_context_with_event_bus.mockReset();
    auth_initialize_mocks.create_default_anonymous_state.mockReset();
    auth_initialize_mocks.get_clerk_email.mockReset();
    auth_initialize_mocks.load_available_profiles.mockReset();
    auth_initialize_mocks.try_restore_anonymous_session.mockReset();
    auth_initialize_mocks.try_restore_signed_in_session.mockReset();
    auth_initialize_mocks.wait_for_clerk.mockReset();
    auth_initialize_mocks.wait_for_clerk.mockResolvedValue(undefined);
    auth_initialize_mocks.load_available_profiles.mockResolvedValue([]);
    auth_initialize_mocks.load_saved_token.mockResolvedValue(null);
    auth_initialize_mocks.load_sidebar_menu_for_role.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns immediately when auth is already initialized", async () => {
    const { execute_auth_initialization } = await import("./authInitialize");

    const result = await execute_auth_initialization(
      build_auth_state({ is_initialized: true }) as never,
      vi.fn(),
    );

    expect(result.success).toBe(true);
    expect(auth_initialize_mocks.wait_for_clerk).not.toHaveBeenCalled();
  });

  it("restores an anonymous session when a saved token can be reused", async () => {
    const restored_state = build_auth_state({
      current_token: { raw_token: "saved-token" },
      available_profiles: [build_profile()],
      is_initialized: true,
      is_demo_session: true,
    });
    const state_setter = vi.fn();

    auth_initialize_mocks.load_available_profiles.mockResolvedValue([
      build_profile(),
    ]);
    auth_initialize_mocks.load_saved_token.mockResolvedValue("saved-token");
    auth_initialize_mocks.try_restore_anonymous_session.mockResolvedValue(
      restored_state,
    );

    const { execute_auth_initialization } = await import("./authInitialize");

    const result = await execute_auth_initialization(
      build_auth_state() as never,
      state_setter,
    );

    expect(result.success).toBe(true);
    expect(state_setter).toHaveBeenCalledWith(restored_state);
    expect(
      auth_initialize_mocks.create_default_anonymous_state,
    ).not.toHaveBeenCalled();
  });

  it("creates a default anonymous state when no anonymous restore is available", async () => {
    const anonymous_state = build_auth_state({
      available_profiles: [build_profile()],
      is_initialized: true,
      is_demo_session: true,
    });
    const state_setter = vi.fn();

    auth_initialize_mocks.load_available_profiles.mockResolvedValue([
      build_profile(),
    ]);
    auth_initialize_mocks.load_saved_token.mockResolvedValue("saved-token");
    auth_initialize_mocks.try_restore_anonymous_session.mockResolvedValue(null);
    auth_initialize_mocks.create_default_anonymous_state.mockResolvedValue(
      anonymous_state,
    );

    const { execute_auth_initialization } = await import("./authInitialize");

    const result = await execute_auth_initialization(
      build_auth_state() as never,
      state_setter,
    );

    expect(result.success).toBe(true);
    expect(state_setter).toHaveBeenCalledWith(anonymous_state);
  });

  it("restores a signed-in session and loads the matching sidebar", async () => {
    const profile = build_profile();
    const token = { raw_token: "restored-token" };
    const sidebar_groups = [{ title: "Operations", items: [] }];
    const state_setter = vi.fn();

    auth_initialize_mocks.set_signed_in(true);
    auth_initialize_mocks.load_available_profiles.mockResolvedValue([profile]);
    auth_initialize_mocks.load_saved_token.mockResolvedValue("restored-token");
    auth_initialize_mocks.get_clerk_email.mockReturnValue("jane@example.test");
    auth_initialize_mocks.try_restore_signed_in_session.mockResolvedValue({
      profile,
      token,
    });
    auth_initialize_mocks.load_sidebar_menu_for_role.mockResolvedValue(
      sidebar_groups,
    );

    const { execute_auth_initialization } = await import("./authInitialize");

    const result = await execute_auth_initialization(
      build_auth_state() as never,
      state_setter,
    );

    expect(result.success).toBe(true);
    expect(state_setter).toHaveBeenCalledWith({
      current_token: token,
      current_profile: profile,
      available_profiles: [profile],
      sidebar_menu_items: sidebar_groups,
      is_initialized: true,
      is_demo_session: false,
    });
    expect(
      auth_initialize_mocks.sync_user_context_with_event_bus,
    ).toHaveBeenCalledWith(profile);
    expect(
      auth_initialize_mocks.sync_branding_with_profile,
    ).toHaveBeenCalledWith(profile);
  });

  it("generates and saves a token when Clerk email matches a local profile", async () => {
    const profile = build_profile({ email: "player@example.test" });
    const generated_token = { raw_token: "generated-token" };
    const state_setter = vi.fn();

    auth_initialize_mocks.set_signed_in(true);
    auth_initialize_mocks.load_available_profiles.mockResolvedValue([profile]);
    auth_initialize_mocks.get_clerk_email.mockReturnValue(
      "PLAYER@EXAMPLE.TEST",
    );
    auth_initialize_mocks.try_restore_signed_in_session.mockResolvedValue(null);
    auth_initialize_mocks.generate_token_for_profile.mockResolvedValue({
      success: true,
      data: generated_token,
    });

    const { execute_auth_initialization } = await import("./authInitialize");

    const result = await execute_auth_initialization(
      build_auth_state() as never,
      state_setter,
    );

    expect(result.success).toBe(true);
    expect(
      auth_initialize_mocks.generate_token_for_profile,
    ).toHaveBeenCalledWith(profile);
    expect(auth_initialize_mocks.save_token).toHaveBeenCalledWith(
      "generated-token",
    );
    expect(auth_initialize_mocks.save_profile_id).toHaveBeenCalledWith(
      "profile-1",
    );
    expect(state_setter).toHaveBeenCalledWith(
      expect.objectContaining({
        current_token: generated_token,
        current_profile: profile,
      }),
    );
  });

  it("fails when there is no local profile for the signed-in Clerk user", async () => {
    const state_setter = vi.fn();

    auth_initialize_mocks.set_signed_in(true);
    auth_initialize_mocks.load_available_profiles.mockResolvedValue([
      build_profile({ email: "someone@example.test" }),
    ]);
    auth_initialize_mocks.get_clerk_email.mockReturnValue(
      "missing@example.test",
    );
    auth_initialize_mocks.try_restore_signed_in_session.mockResolvedValue(null);

    const { execute_auth_initialization } = await import("./authInitialize");

    const result = await execute_auth_initialization(
      build_auth_state() as never,
      state_setter,
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("no local profile found");
    }
    expect(state_setter).not.toHaveBeenCalled();
  });
});
