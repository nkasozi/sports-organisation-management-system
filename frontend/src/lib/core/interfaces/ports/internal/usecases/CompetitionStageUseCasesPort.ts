import type {
  CompetitionStage,
  CreateCompetitionStageInput,
  UpdateCompetitionStageInput,
} from "../../../../entities/CompetitionStage";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type { CompetitionStageFilter } from "../../external/repositories/CompetitionStageRepository";
import type { QueryOptions } from "../../external/repositories/Repository";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";
import type { AsyncResult, PaginatedAsyncResult } from "./BaseUseCasesPort";

export interface CompetitionStageUseCasesPort extends BaseUseCasesPort<
  CompetitionStage,
  CreateCompetitionStageInput,
  UpdateCompetitionStageInput,
  CompetitionStageFilter
> {
  list_stages_by_competition(
    competition_id: ScalarValueInput<CompetitionStage["competition_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CompetitionStage>;
  reorder_stages(
    competition_id: ScalarValueInput<CompetitionStage["competition_id"]>,
    ordered_stage_ids: Array<ScalarValueInput<CompetitionStage["id"]>>,
  ): AsyncResult<boolean>;
}
