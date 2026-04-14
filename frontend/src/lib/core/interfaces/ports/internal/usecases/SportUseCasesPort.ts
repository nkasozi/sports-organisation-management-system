import type {
  CreateSportInput,
  Sport,
  UpdateSportInput,
} from "../../../../entities/Sport";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type { AsyncResult } from "../../../../types/Result";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface SportUseCasesPort extends BaseUseCasesPort<
  Sport,
  CreateSportInput,
  UpdateSportInput
> {
  delete_sports(ids: Array<ScalarValueInput<Sport["id"]>>): AsyncResult<number>;
}
