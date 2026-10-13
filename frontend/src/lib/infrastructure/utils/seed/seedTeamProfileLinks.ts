import { generate_current_timestamp, SEED_TEAM_PROFILE_IDS } from "./seedIds";

const SEED_TEAM_PROFILE_LINK_IDS = {
  WEATHERHEAD_TWITTER: "team_link_001",
  WEATHERHEAD_INSTAGRAM: "team_link_002",
  WEATHERHEAD_WEBSITE: "team_link_003",
  WEATHERHEAD_VIDEO: "team_link_004",
  KAMPALA_HC_FACEBOOK: "team_link_005",
  KAMPALA_HC_WEBSITE: "team_link_006",
};

type SeedRow = Omit<
  import("$lib/core/types/DomainScalars").ScalarInput<
    import("../../../core/entities/ProfileLink").ProfileLink
  >,
  "created_at" | "updated_at"
>;

const WEATHERHEAD_TWITTER_ROW: SeedRow = {
  id: SEED_TEAM_PROFILE_LINK_IDS.WEATHERHEAD_TWITTER,
  profile_id: SEED_TEAM_PROFILE_IDS.WEATHERHEAD_HC_PROFILE,
  platform: "twitter",
  title: "@WeatherheadHC",
  url: "https://twitter.com/weatherheadhc",
  display_order: 1,
  status: "active",
};

const WEATHERHEAD_INSTAGRAM_ROW: SeedRow = {
  id: SEED_TEAM_PROFILE_LINK_IDS.WEATHERHEAD_INSTAGRAM,
  profile_id: SEED_TEAM_PROFILE_IDS.WEATHERHEAD_HC_PROFILE,
  platform: "instagram",
  title: "@weatherhead_hockey",
  url: "https://instagram.com/weatherhead_hockey",
  display_order: 2,
  status: "active",
};

const WEATHERHEAD_WEBSITE_ROW: SeedRow = {
  id: SEED_TEAM_PROFILE_LINK_IDS.WEATHERHEAD_WEBSITE,
  profile_id: SEED_TEAM_PROFILE_IDS.WEATHERHEAD_HC_PROFILE,
  platform: "website",
  title: "Official Website",
  url: "https://weatherheadhc.ug",
  display_order: 3,
  status: "active",
};

const WEATHERHEAD_VIDEO_ROW: SeedRow = {
  id: SEED_TEAM_PROFILE_LINK_IDS.WEATHERHEAD_VIDEO,
  profile_id: SEED_TEAM_PROFILE_IDS.WEATHERHEAD_HC_PROFILE,
  platform: "youtube",
  title: "Team Highlights 2025",
  url: "https://youtube.com/watch?v=weatherhead2025",
  display_order: 4,
  status: "active",
};

const KAMPALA_HC_FACEBOOK_ROW: SeedRow = {
  id: SEED_TEAM_PROFILE_LINK_IDS.KAMPALA_HC_FACEBOOK,
  profile_id: SEED_TEAM_PROFILE_IDS.KAMPALA_HC_PROFILE,
  platform: "facebook",
  title: "Kampala Hockey Club",
  url: "https://facebook.com/kampalahockeyclub",
  display_order: 1,
  status: "active",
};

const KAMPALA_HC_WEBSITE_ROW: SeedRow = {
  id: SEED_TEAM_PROFILE_LINK_IDS.KAMPALA_HC_WEBSITE,
  profile_id: SEED_TEAM_PROFILE_IDS.KAMPALA_HC_PROFILE,
  platform: "website",
  title: "Official Site",
  url: "https://kampalahockeyclub.ug",
  display_order: 2,
  status: "active",
};

export function create_seed_team_profile_links(): import("$lib/core/types/DomainScalars").ScalarInput<
  import("../../../core/entities/ProfileLink").ProfileLink
>[] {
  const now = generate_current_timestamp();

  return [
    { ...WEATHERHEAD_TWITTER_ROW },
    { ...WEATHERHEAD_INSTAGRAM_ROW },
    { ...WEATHERHEAD_WEBSITE_ROW },
    { ...WEATHERHEAD_VIDEO_ROW },
    { ...KAMPALA_HC_FACEBOOK_ROW },
    { ...KAMPALA_HC_WEBSITE_ROW },
  ].map((row) => ({ ...row, created_at: now, updated_at: now }));
}
