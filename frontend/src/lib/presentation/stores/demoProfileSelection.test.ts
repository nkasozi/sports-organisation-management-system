import { describe, expect, it } from "vitest";

import { SEED_SYSTEM_USER_IDS } from "$lib/infrastructure/utils/seed/seedIds";

import { PUBLIC_VIEWER_PROFILE_ID } from "./authStoreConstants";
import type { UserProfile } from "./authTypes";
import { is_demo_profile, select_demo_profiles } from "./demoProfileSelection";

function build_profile(id: string): UserProfile {
  return {
    id,
    display_name: "Profile",
    email: "",
    role: "player",
    organization_id: "org_default_1",
    organization_name: "Demo Organisation",
    team_id: "",
  } as UserProfile;
}

describe("demoProfileSelection", () => {
  it("treats the public viewer and every seeded demo user as demo profiles", () => {
    expect(is_demo_profile(build_profile(PUBLIC_VIEWER_PROFILE_ID))).toBe(true);
    Object.values(SEED_SYSTEM_USER_IDS).forEach((seed_user_id: string) => {
      expect(is_demo_profile(build_profile(seed_user_id))).toBe(true);
    });
  });

  it("never treats a real synced system user as a demo profile", () => {
    expect(is_demo_profile(build_profile("k17abc_real_user"))).toBe(false);
  });

  it("keeps only demo profiles and preserves their order", () => {
    const public_viewer = build_profile(PUBLIC_VIEWER_PROFILE_ID);
    const real_user = build_profile("k17abc_real_user");
    const seeded_player = build_profile(
      SEED_SYSTEM_USER_IDS.PLAYER_DENIS_ONYANGO,
    );

    expect(
      select_demo_profiles([public_viewer, real_user, seeded_player]),
    ).toEqual([public_viewer, seeded_player]);
  });

  it("returns an empty list when there are no demo profiles", () => {
    expect(select_demo_profiles([build_profile("k17abc_real_user")])).toEqual(
      [],
    );
  });
});
