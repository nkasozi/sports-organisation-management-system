import type { ProfileLink } from "../../core/entities/ProfileLink";
import type { ScalarInput } from "../../core/types/DomainScalars";

type DefaultProfileLinkRow = Omit<
  ScalarInput<ProfileLink>,
  "created_at" | "updated_at"
>;

const DEFAULT_PROFILE_LINK_ROWS: DefaultProfileLinkRow[] = [
  {
    id: "profilelink_default_1",
    profile_id: "player_profile_default_1",
    platform: "twitter",
    title: "Official Twitter",
    url: "https://twitter.com/ugandahockey",
    display_order: 1,
    status: "active",
  },
  {
    id: "profilelink_default_2",
    profile_id: "player_profile_default_1",
    platform: "instagram",
    title: "Instagram",
    url: "https://instagram.com/ugandahockey",
    display_order: 2,
    status: "active",
  },
  {
    id: "profilelink_default_3",
    profile_id: "team_profile_default_1",
    platform: "facebook",
    title: "Team Facebook Page",
    url: "https://facebook.com/weatherheadfc",
    display_order: 1,
    status: "active",
  },
  {
    id: "profilelink_default_4",
    profile_id: "team_profile_default_1",
    platform: "website",
    title: "Official Website",
    url: "https://weatherheadfc.ug",
    display_order: 2,
    status: "active",
  },
];

export function create_default_profile_links(): ScalarInput<ProfileLink>[] {
  const now = new Date().toISOString();
  return DEFAULT_PROFILE_LINK_ROWS.map(
    (row) =>
      ({
        ...row,
        created_at: now,
        updated_at: now,
      }) as ScalarInput<ProfileLink>,
  );
}
