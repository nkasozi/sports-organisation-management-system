import type { InBrowserPlayerProfileRepository } from "../repositories/InBrowserPlayerProfileRepository";
import type { InBrowserTeamProfileRepository } from "../repositories/InBrowserTeamProfileRepository";
import type { InBrowserProfileLinkRepository } from "../repositories/InBrowserProfileLinkRepository";
import {
  create_seed_player_profiles,
  create_seed_team_profiles,
  create_seed_profile_links,
  create_seed_team_profile_links,
} from "../../infrastructure/utils/SeedDataGenerator";
import type { Result } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { emit_entity_created_events } from "./seedingUserSetup";

export async function seed_demo_player_profiles(
  player_profile_repository: InBrowserPlayerProfileRepository,
): Promise<Result<number>> {
  console.log("[Seeding] Seeding demo player profiles");
  const seed_player_profiles = create_seed_player_profiles();
  const result =
    await player_profile_repository.seed_with_data(seed_player_profiles);
  if (!result.success) {
    console.error(`[Seeding] Player profile seeding failed: ${result.error}`);
    return create_failure_result(
      `Player profile seeding failed: ${result.error}`,
    );
  }
  emit_entity_created_events(
    "player_profile",
    seed_player_profiles,
    (p) => `Profile: ${p.profile_slug}`,
  );
  console.log(
    `[Seeding] Seeded ${seed_player_profiles.length} player profiles`,
  );
  return create_success_result(seed_player_profiles.length);
}

export async function seed_demo_team_profiles(
  team_profile_repository: InBrowserTeamProfileRepository,
): Promise<Result<number>> {
  console.log("[Seeding] Seeding demo team profiles");
  const seed_team_profiles = create_seed_team_profiles();
  const result =
    await team_profile_repository.seed_with_data(seed_team_profiles);
  if (!result.success) {
    console.error(`[Seeding] Team profile seeding failed: ${result.error}`);
    return create_failure_result(
      `Team profile seeding failed: ${result.error}`,
    );
  }
  emit_entity_created_events(
    "team_profile",
    seed_team_profiles,
    (p) => `Team Profile: ${p.profile_slug}`,
  );
  console.log(`[Seeding] Seeded ${seed_team_profiles.length} team profiles`);
  return create_success_result(seed_team_profiles.length);
}

export async function seed_demo_profile_links(
  profile_link_repository: InBrowserProfileLinkRepository,
): Promise<Result<number>> {
  console.log("[Seeding] Seeding demo profile links");
  const all_profile_links = [
    ...create_seed_profile_links(),
    ...create_seed_team_profile_links(),
  ];
  const result =
    await profile_link_repository.seed_with_data(all_profile_links);
  if (!result.success) {
    console.error(`[Seeding] Profile link seeding failed: ${result.error}`);
    return create_failure_result(
      `Profile link seeding failed: ${result.error}`,
    );
  }
  emit_entity_created_events(
    "profile_link",
    all_profile_links,
    (l) => `Link: ${l.title}`,
  );
  console.log(`[Seeding] Seeded ${all_profile_links.length} profile links`);
  return create_success_result(all_profile_links.length);
}
