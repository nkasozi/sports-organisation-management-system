import { generate_current_timestamp, SEED_PLAYER_PROFILE_IDS } from "./seedIds";

const SEED_PROFILE_LINK_IDS = {
  DENIS_TWITTER: "profile-link-001",
  DENIS_INSTAGRAM: "profile-link-002",
  DENIS_WEBSITE: "profile-link-003",
  DENIS_VIDEO: "profile-link-004",
  BRIAN_INSTAGRAM: "profile-link-005",
  BRIAN_VIDEO: "profile-link-006",
};

type SeedRow = Omit<
  import("$lib/core/types/DomainScalars").ScalarInput<
    import("../../../core/entities/ProfileLink").ProfileLink
  >,
  "created_at" | "updated_at"
>;

const DENIS_TWITTER_ROW: SeedRow = {
  id: SEED_PROFILE_LINK_IDS.DENIS_TWITTER,
  profile_id: SEED_PLAYER_PROFILE_IDS.DENIS_ONYANGO_PROFILE,
  platform: "twitter",
  title: "@denisonyango_hockey",
  url: "https://twitter.com/denisonyango_hockey",
  display_order: 1,
  status: "active",
};

const DENIS_INSTAGRAM_ROW: SeedRow = {
  id: SEED_PROFILE_LINK_IDS.DENIS_INSTAGRAM,
  profile_id: SEED_PLAYER_PROFILE_IDS.DENIS_ONYANGO_PROFILE,
  platform: "instagram",
  title: "@denis.onyango",
  url: "https://instagram.com/denis.onyango",
  display_order: 2,
  status: "active",
};

const DENIS_WEBSITE_ROW: SeedRow = {
  id: SEED_PROFILE_LINK_IDS.DENIS_WEBSITE,
  profile_id: SEED_PLAYER_PROFILE_IDS.DENIS_ONYANGO_PROFILE,
  platform: "website",
  title: "Uganda Hockey Profile",
  url: "https://ugandahockey.org/players/denis-onyango",
  display_order: 3,
  status: "active",
};

const DENIS_VIDEO_ROW: SeedRow = {
  id: SEED_PROFILE_LINK_IDS.DENIS_VIDEO,
  profile_id: SEED_PLAYER_PROFILE_IDS.DENIS_ONYANGO_PROFILE,
  platform: "youtube",
  title: "Season Highlights 2025",
  url: "https://youtube.com/watch?v=ughockey2025",
  display_order: 4,
  status: "active",
};

const BRIAN_INSTAGRAM_ROW: SeedRow = {
  id: SEED_PROFILE_LINK_IDS.BRIAN_INSTAGRAM,
  profile_id: SEED_PLAYER_PROFILE_IDS.BRIAN_SSALI_PROFILE,
  platform: "instagram",
  title: "@brian_ssali",
  url: "https://instagram.com/brian_ssali",
  display_order: 1,
  status: "active",
};

const BRIAN_VIDEO_ROW: SeedRow = {
  id: SEED_PROFILE_LINK_IDS.BRIAN_VIDEO,
  profile_id: SEED_PLAYER_PROFILE_IDS.BRIAN_SSALI_PROFILE,
  platform: "youtube",
  title: "Best Plays Compilation",
  url: "https://youtube.com/watch?v=brianssali2025",
  display_order: 2,
  status: "active",
};

export function create_seed_profile_links(): import("$lib/core/types/DomainScalars").ScalarInput<
  import("../../../core/entities/ProfileLink").ProfileLink
>[] {
  const now = generate_current_timestamp();

  return [
    { ...DENIS_TWITTER_ROW },
    { ...DENIS_INSTAGRAM_ROW },
    { ...DENIS_WEBSITE_ROW },
    { ...DENIS_VIDEO_ROW },
    { ...BRIAN_INSTAGRAM_ROW },
    { ...BRIAN_VIDEO_ROW },
  ].map((row) => ({ ...row, created_at: now, updated_at: now }));
}
