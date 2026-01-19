import type {
  Venue,
  CreateVenueInput,
  UpdateVenueInput,
} from "../../entities/Venue";
import type { VenueFilter } from "../adapters/VenueRepository";
import type { AsyncResult } from "../../types/Result";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface VenueUseCasesPort extends BaseUseCasesPort<
  Venue,
  CreateVenueInput,
  UpdateVenueInput,
  VenueFilter
> {
  delete_venues(ids: string[]): Promise<AsyncResult<number>>;
}
