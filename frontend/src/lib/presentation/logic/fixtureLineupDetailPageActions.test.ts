import { describe, expect, it, vi } from "vitest";

import type { FixtureLineup } from "$lib/core/entities/FixtureLineup";

import {
  authorize_fixture_lineup_detail_page,
  save_fixture_lineup_changes,
  submit_fixture_lineup_changes,
} from "./fixtureLineupDetailPageActions";

function create_lineup(overrides: Partial<FixtureLineup> = {}): FixtureLineup {
  return {
    id: "lineup_1",
    organization_id: "org_1",
    fixture_id: "fixture_1",
    team_id: "team_1",
    selected_players: [{ id: "player_1" }] as FixtureLineup["selected_players"],
    status: "draft",
    submitted_by: "Coach 1",
    submitted_at: "2026-01-01T00:00:00Z",
    notes: "Ready",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as FixtureLineup;
}

describe("authorize_fixture_lineup_detail_page", () => {
  it("fails with the caller message when the read authorization request fails", async () => {
    const authorization_adapter = {
      check_entity_authorized: vi.fn(async () => ({ success: false })),
    } as never;

    const result = await authorize_fixture_lineup_detail_page(
      authorization_adapter,
      "raw-token",
      "fixture_lineup",
      "read",
      "update",
      "Access check failed",
    );

    expect(result).toEqual({
      success: false,
      error_message: "Access check failed",
    });
  });

  it("reports read authorization and permission info when updates are denied", async () => {
    const authorization_adapter = {
      check_entity_authorized: vi
        .fn()
        .mockResolvedValueOnce({
          success: true,
          data: { is_authorized: true, role: "team_manager" },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { is_authorized: false, role: "team_manager" },
        }),
    } as never;

    const result = await authorize_fixture_lineup_detail_page(
      authorization_adapter,
      "raw-token",
      "fixture_lineup",
      "read",
      "update",
      "Access check failed",
    );

    expect(result).toEqual({
      success: true,
      can_modify_lineup: false,
      permission_info_message:
        'Your role "team_manager" can view lineup details but cannot modify them. Contact an administrator if you need edit access.',
      is_read_authorized: true,
    });
  });
});

describe("save_fixture_lineup_changes", () => {
  it("submits the editable lineup fields and preserves dependency errors", async () => {
    const update_lineup = vi.fn(async () => ({
      success: false,
      error: "Save failed",
    }));

    const result = await save_fixture_lineup_changes(
      "lineup_1",
      create_lineup(),
      update_lineup,
      "Update failed",
    );

    expect(update_lineup).toHaveBeenCalledWith("lineup_1", {
      selected_players: [{ id: "player_1" }],
      notes: "Ready",
    });
    expect(result).toEqual({ success: false, error_message: "Save failed" });
  });

  it("falls back to the caller failure message when the dependency omits one", async () => {
    const result = await save_fixture_lineup_changes(
      "lineup_1",
      create_lineup(),
      async () => ({ success: false }),
      "Update failed",
    );

    expect(result).toEqual({ success: false, error_message: "Update failed" });
  });
});

describe("submit_fixture_lineup_changes", () => {
  it("returns success on a successful submit and maps fallback failure text", async () => {
    await expect(
      submit_fixture_lineup_changes(
        "lineup_1",
        async () => ({ success: true }),
        "Submit failed",
      ),
    ).resolves.toEqual({ success: true });

    await expect(
      submit_fixture_lineup_changes(
        "lineup_1",
        async () => ({ success: false }),
        "Submit failed",
      ),
    ).resolves.toEqual({ success: false, error_message: "Submit failed" });
  });
});
