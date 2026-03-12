import type { BaseUseCasesPort } from "./BaseUseCasesPort";
import type { AsyncResult, PaginatedAsyncResult } from "./BaseUseCasesPort";
import type { QueryOptions } from "../../external/repositories/Repository";
import type {
  CompetitionStage,
  CreateCompetitionStageInput,
  UpdateCompetitionStageInput,
} from "../../../../entities/CompetitionStage";
import type { CompetitionStageFilter } from "../../external/repositories/CompetitionStageRepository";

export interface CompetitionStageUseCasesPort extends BaseUseCasesPort<
  CompetitionStage,
  CreateCompetitionStageInput,
  UpdateCompetitionStageInput,
  CompetitionStageFilter
> {
  list_stages_by_competition(
    competition_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CompetitionStage>;
  reorder_stages(
    competition_id: string,
    ordered_stage_ids: string[],
  ): AsyncResult<boolean>;
}
