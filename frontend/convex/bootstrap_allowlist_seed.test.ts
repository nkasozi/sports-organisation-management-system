import { afterEach, describe, expect, it, vi } from "vitest";

import { seed_admin_user } from "./admin_seed";
import { seed_super_admin } from "./authorization_mutations";
import {
  BOOTSTRAP_ALLOWLIST_ENVIRONMENT_VARIABLE,
  BOOTSTRAP_ALLOWLIST_NOT_CONFIGURED_MESSAGE,
} from "./lib/bootstrap_allowlist";
import {
  authenticated_identity,
  create_fake_convex_context,
  type FakeIdentity,
  find_table_rows,
  invoke_convex_handler,
  unverified_identity,
} from "./lib/fake_convex_context.test_support";
import { STRANGER_EMAIL } from "./lib/security_test_fixtures.test_support";

type SeedResult = { success: boolean; error?: string };

const SEED_MUTATIONS = [
  ["seed_admin_user", seed_admin_user],
  ["seed_super_admin", seed_super_admin],
] as const;

async function bootstrap_as(
  seed_mutation: unknown,
  identity: FakeIdentity,
): Promise<{ result: SeedResult; stored_user_count: number }> {
  const context = create_fake_convex_context({
    identity,
    tables: { system_users: [] },
  });
  const result = await invoke_convex_handler<SeedResult>(
    seed_mutation,
    context,
    { email: STRANGER_EMAIL },
  );
  return {
    result,
    stored_user_count: find_table_rows(context, "system_users").length,
  };
}

describe.each(SEED_MUTATIONS)("%s bootstrap allowlist", (_, seed_mutation) => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("refuses bootstrap with a clear message when the allowlist is unset", async () => {
    vi.stubEnv(BOOTSTRAP_ALLOWLIST_ENVIRONMENT_VARIABLE, "");
    const outcome = await bootstrap_as(
      seed_mutation,
      authenticated_identity(STRANGER_EMAIL),
    );
    expect(outcome.result).toMatchObject({
      success: false,
      error: BOOTSTRAP_ALLOWLIST_NOT_CONFIGURED_MESSAGE,
    });
    expect(outcome.stored_user_count).toBe(0);
  });

  it("refuses bootstrap for emails outside the allowlist", async () => {
    vi.stubEnv(BOOTSTRAP_ALLOWLIST_ENVIRONMENT_VARIABLE, "owner@example.com");
    const outcome = await bootstrap_as(
      seed_mutation,
      authenticated_identity(STRANGER_EMAIL),
    );
    expect(outcome.result.success).toBe(false);
    expect(outcome.stored_user_count).toBe(0);
  });

  it("refuses bootstrap when the caller email is unverified", async () => {
    vi.stubEnv(BOOTSTRAP_ALLOWLIST_ENVIRONMENT_VARIABLE, STRANGER_EMAIL);
    const outcome = await bootstrap_as(
      seed_mutation,
      unverified_identity(STRANGER_EMAIL),
    );
    expect(outcome.result.success).toBe(false);
    expect(outcome.stored_user_count).toBe(0);
  });

  it("allows an allowlisted, verified caller to bootstrap themselves", async () => {
    vi.stubEnv(BOOTSTRAP_ALLOWLIST_ENVIRONMENT_VARIABLE, STRANGER_EMAIL);
    const outcome = await bootstrap_as(
      seed_mutation,
      authenticated_identity(STRANGER_EMAIL),
    );
    expect(outcome.result.success).toBe(true);
    expect(outcome.stored_user_count).toBe(1);
  });
});
