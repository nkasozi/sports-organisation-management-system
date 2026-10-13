import type { Result } from "../../core/types/Result";
import {
  create_seed_competition_stages,
  create_seed_competitions,
} from "../../infrastructure/utils/SeedDataGenerator";
import type { InBrowserCompetitionRepository } from "../repositories/InBrowserCompetitionRepository";
import type { InBrowserCompetitionStageRepository } from "../repositories/InBrowserCompetitionStageRepository";
import { seed_demo_entity_batch } from "./demoEntityBatchSeeder";
import type { SeedEntityIdLookups } from "./seedingTypes";

export async function seed_demo_competitions(
  competition_repository: InBrowserCompetitionRepository,
  entity_id_lookups: SeedEntityIdLookups,
): Promise<Result<number>> {
  return seed_demo_entity_batch({
    plural_label: "competitions",
    entity_type: "competition",
    entities: create_seed_competitions(
      entity_id_lookups.competition_format_ids,
    ),
    seed: (competitions) => competition_repository.seed_with_data(competitions),
    describe_entity: (c) => c.name,
  });
}

export async function seed_demo_competition_stages(
  competition_stage_repository: InBrowserCompetitionStageRepository,
): Promise<Result<number>> {
  return seed_demo_entity_batch({
    plural_label: "competition stages",
    entity_type: "competition_stage",
    entities: create_seed_competition_stages(),
    seed: (stages) => competition_stage_repository.seed_with_data(stages),
    describe_entity: (s) => `${s.name} (${s.competition_id})`,
  });
}
