import type {
  CreateVenueInput,
  UpdateVenueInput,
  Venue,
} from "../../../../entities/Venue";
import type { PaginatedAsyncResult } from "../../../../types/Result";
import type { FilterableRepository, QueryOptions } from "./Repository";

export interface VenueFilter {
  organization_id?: string;
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
