import type { FilterableRepository, QueryOptions } from "./Repository";
import type { PaginatedAsyncResult } from "../../types/Result";
import type {
  Venue,
  CreateVenueInput,
  UpdateVenueInput,
} from "../../entities/Venue";

export interface VenueFilter {
  name_contains?: string;
  city?: string;
  country?: string;
  status?: Venue["status"];
}

export interface VenueRepository extends FilterableRepository<
  Venue,
  CreateVenueInput,
  UpdateVenueInput,
  VenueFilter
> {
  find_active_venues(options?: QueryOptions): PaginatedAsyncResult<Venue>;
}
