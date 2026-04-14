import type { EntityStatus } from "../../../../entities/BaseEntity";
import type {
  CompetitionStage,
  CreateCompetitionStageInput,
  StageType,
  UpdateCompetitionStageInput,
} from "../../../../entities/CompetitionStage";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type { FilterableRepository } from "./Repository";
import type { PaginatedAsyncResult, QueryOptions } from "./Repository";

export interface CompetitionStageFilter {
  competition_id?: ScalarValueInput<CompetitionStage["competition_id"]>;
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
    competition_id: ScalarValueInput<CompetitionStage["competition_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CompetitionStage>;
}

export type {
  CompetitionStage,
  CreateCompetitionStageInput,
  UpdateCompetitionStageInput,
};
