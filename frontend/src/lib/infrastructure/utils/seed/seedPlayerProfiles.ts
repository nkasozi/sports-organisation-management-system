import { generate_current_timestamp, SEED_PLAYER_PROFILE_IDS } from "./seedIds";
import { SEED_PLAYER_IDS } from "./seedPlayerIds";

export function create_seed_player_profiles(): import("$lib/core/types/DomainScalars").ScalarInput<import("../../../core/entities/PlayerProfile").PlayerProfile>[] {
  const now = generate_current_timestamp();

  return [
    {
      id: SEED_PLAYER_PROFILE_IDS.DENIS_ONYANGO_PROFILE,
      player_id: SEED_PLAYER_IDS.DENIS_ONYANGO,
      profile_summary:
        "A dynamic forward and captain of Weatherhead HC, known for exceptional ball control and clinical finishing. Denis has represented Uganda at the Africa Cup of Nations and is the leading scorer in the National Hockey League for three consecutive seasons.",
      visibility: "public",
      profile_slug: "denis-onyango-player",
      featured_image_url: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: SEED_PLAYER_PROFILE_IDS.BRIAN_SSALI_PROFILE,
      player_id: SEED_PLAYER_IDS.BRIAN_SSALI,
      profile_summary:
        "An experienced midfielder with exceptional vision and passing ability. Brian is the playmaker for Weatherhead HC and has been instrumental in the team's dominant performances in the Easter Cup.",
      visibility: "public",
      profile_slug: "brian-ssali-player",
      featured_image_url: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: SEED_PLAYER_PROFILE_IDS.SARAH_NAMUGWANYA_PROFILE,
      player_id: SEED_PLAYER_IDS.SARAH_NAMUGWANYA,
      profile_summary:
        "A talented goalkeeper with remarkable reflexes and shot-stopping ability. Sarah anchors the Weatherhead HC defense and has represented Uganda in international women's hockey tournaments.",
      visibility: "public",
      profile_slug: "sarah-namugwanya-player",
      featured_image_url: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
  ];
}
