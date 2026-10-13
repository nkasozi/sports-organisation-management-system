import type { Result } from "../../core/types/Result";
import {
  create_seed_player_profiles,
  create_seed_profile_links,
  create_seed_team_profile_links,
  create_seed_team_profiles,
} from "../../infrastructure/utils/SeedDataGenerator";
import type { InBrowserPlayerProfileRepository } from "../repositories/InBrowserPlayerProfileRepository";
import type { InBrowserProfileLinkRepository } from "../repositories/InBrowserProfileLinkRepository";
import type { InBrowserTeamProfileRepository } from "../repositories/InBrowserTeamProfileRepository";
import { seed_demo_entity_batch } from "./demoEntityBatchSeeder";

export async function seed_demo_player_profiles(
  player_profile_repository: InBrowserPlayerProfileRepository,
): Promise<Result<number>> {
  return seed_demo_entity_batch({
    plural_label: "player profiles",
    entity_type: "player_profile",
    entities: create_seed_player_profiles(),
    seed: (profiles) => player_profile_repository.seed_with_data(profiles),
    describe_entity: (p) => `Profile: ${p.profile_slug}`,
  });
}

export async function seed_demo_team_profiles(
  team_profile_repository: InBrowserTeamProfileRepository,
): Promise<Result<number>> {
  return seed_demo_entity_batch({
    plural_label: "team profiles",
    entity_type: "team_profile",
    entities: create_seed_team_profiles(),
    seed: (profiles) => team_profile_repository.seed_with_data(profiles),
    describe_entity: (p) => `Team Profile: ${p.profile_slug}`,
  });
}

export async function seed_demo_profile_links(
  profile_link_repository: InBrowserProfileLinkRepository,
): Promise<Result<number>> {
  return seed_demo_entity_batch({
    plural_label: "profile links",
    entity_type: "profile_link",
    entities: [
      ...create_seed_profile_links(),
      ...create_seed_team_profile_links(),
    ],
    seed: (links) => profile_link_repository.seed_with_data(links),
    describe_entity: (l) => `Link: ${l.title}`,
  });
}
