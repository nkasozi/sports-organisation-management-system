import type {
  Sport,
  CreateSportInput,
  UpdateSportInput,
} from "../../entities/Sport";
import type { AsyncResult } from "../../types/Result";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface SportUseCasesPort extends BaseUseCasesPort<
  Sport,
  CreateSportInput,
  UpdateSportInput
> {
  delete_sports(ids: string[]): Promise<AsyncResult<number>>;
}
