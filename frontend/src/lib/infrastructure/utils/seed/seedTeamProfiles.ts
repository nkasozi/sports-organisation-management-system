import {
  generate_current_timestamp,
  SEED_TEAM_IDS,
  SEED_TEAM_PROFILE_IDS,
} from "./seedIds";

export function create_seed_team_profiles(): import("$lib/core/types/DomainScalars").ScalarInput<import("../../../core/entities/TeamProfile").TeamProfile>[] {
  const now = generate_current_timestamp();

  return [
    {
      id: SEED_TEAM_PROFILE_IDS.WEATHERHEAD_HC_PROFILE,
      team_id: SEED_TEAM_IDS.WEATHERHEAD_HC,
      profile_summary:
        "Weatherhead Hockey Club is one of Uganda's most prestigious field hockey clubs. Based in Kampala, the club has a rich history of producing national team players and has won multiple Uganda Cup and Easter Cup titles. Known for their technical style and youth development programs.",
      visibility: "public",
      profile_slug: "weatherhead-hockey-club",
      featured_image_url: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: SEED_TEAM_PROFILE_IDS.KAMPALA_HC_PROFILE,
      team_id: SEED_TEAM_IDS.KAMPALA_HC,
      profile_summary:
        "Kampala Hockey Club is a founding member of the Uganda Hockey Association. With a passionate supporter base, the club has been at the forefront of hockey development in the capital city for decades.",
      visibility: "public",
      profile_slug: "kampala-hockey-club",
      featured_image_url: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: SEED_TEAM_PROFILE_IDS.ROCKETS_HC_PROFILE,
      team_id: SEED_TEAM_IDS.ROCKETS_HC,
      profile_summary:
        "Rockets Hockey Club brings speed and dynamism to Ugandan hockey. Known for their aggressive attacking style and strong team spirit, the Rockets have become a fan favorite in recent years.",
      visibility: "public",
      profile_slug: "rockets-hockey-club",
      featured_image_url: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: SEED_TEAM_PROFILE_IDS.WANANCHI_HC_PROFILE,
      team_id: SEED_TEAM_IDS.WANANCHI_HC,
      profile_summary:
        "Wananchi Hockey Club represents the heart of grassroots hockey in Uganda. The club is committed to making hockey accessible to all and has developed numerous players who have gone on to represent Uganda internationally.",
      visibility: "public",
      profile_slug: "wananchi-hockey-club",
      featured_image_url: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: SEED_TEAM_PROFILE_IDS.MAKERERE_UNIVERSITY_PROFILE,
      team_id: SEED_TEAM_IDS.MAKERERE_UNIVERSITY_HC,
      profile_summary:
        "Makerere University Hockey Club combines academic excellence with sporting prowess. The club dominates the University Hockey Championship and serves as a pipeline for talented student-athletes into senior club hockey.",
      visibility: "public",
      profile_slug: "makerere-university-hockey-club",
      featured_image_url: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: SEED_TEAM_PROFILE_IDS.KYAMBOGO_UNIVERSITY_PROFILE,
      team_id: SEED_TEAM_IDS.KYAMBOGO_UNIVERSITY_HC,
      profile_summary:
        "Kyambogo University Hockey Club is a rising force in Ugandan university hockey. With strong support from the university administration, the club has built excellent facilities and competitive programs.",
      visibility: "public",
      profile_slug: "kyambogo-university-hockey-club",
      featured_image_url: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: SEED_TEAM_PROFILE_IDS.SIMBA_HC_PROFILE,
      team_id: SEED_TEAM_IDS.SIMBA_HC,
      profile_summary:
        "Simba Hockey Club embodies the fierce competitive spirit of the lion after which it is named. The club focuses on disciplined defense and tactical awareness, making them tough opponents for any team in the league.",
      visibility: "public",
      profile_slug: "simba-hockey-club",
      featured_image_url: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: SEED_TEAM_PROFILE_IDS.STRIKERS_HC_PROFILE,
      team_id: SEED_TEAM_IDS.STRIKERS_HC,
      profile_summary:
        "Strikers Hockey Club is known for their goal-scoring prowess and entertaining style of play. The club has invested heavily in their attacking setup and regularly features among the top scorers in the National Hockey League.",
      visibility: "public",
      profile_slug: "strikers-hockey-club",
      featured_image_url: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
  ];
}
