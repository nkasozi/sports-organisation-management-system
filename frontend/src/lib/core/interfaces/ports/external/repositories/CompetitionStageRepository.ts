import type { FilterableRepository } from "./Repository";
import type { QueryOptions, PaginatedAsyncResult } from "./Repository";
import type {
  CompetitionStage,
  CreateCompetitionStageInput,
  UpdateCompetitionStageInput,
  StageType,
} from "../../../../entities/CompetitionStage";
import type { EntityStatus } from "../../../../entities/BaseEntity";

export interface CompetitionStageFilter {
  competition_id?: string;
  stage_type?: StageType;
  name_contains?: string;
  status?: EntityStatus;
}

export interface CompetitionStageRepository extends FilterableRepository<
  CompetitionStage,
  CreateCompetitionStageInput,
  UpdateCompetitionStageInput,
  CompetitionStageFilter
> {
  find_by_competition(
    competition_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CompetitionStage>;
}

export type {
  CompetitionStage,
  CreateCompetitionStageInput,
  UpdateCompetitionStageInput,
};
