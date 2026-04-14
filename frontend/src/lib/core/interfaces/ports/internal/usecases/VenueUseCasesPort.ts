import type {
  CreateVenueInput,
  UpdateVenueInput,
  Venue,
} from "../../../../entities/Venue";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type { AsyncResult } from "../../../../types/Result";
import type { VenueFilter } from "../../external/repositories/VenueRepository";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface VenueUseCasesPort extends BaseUseCasesPort<
  Venue,
  CreateVenueInput,
  UpdateVenueInput,
  VenueFilter
> {
  delete_venues(
    ids: Array<ScalarValueInput<Venue["id"]>>,
  ): AsyncResult<number>;
}
