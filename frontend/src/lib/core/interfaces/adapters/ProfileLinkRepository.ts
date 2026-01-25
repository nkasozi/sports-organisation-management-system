import type {
  ProfileLink,
  CreateProfileLinkInput,
  UpdateProfileLinkInput,
} from "../../entities/ProfileLink";
import type { FilterableRepository, QueryOptions } from "./Repository";
import type { AsyncResult, PaginatedAsyncResult } from "../../types/Result";

export interface ProfileLinkFilter {
  profile_id?: string;
  platform?: string;
  status?: string;
}

export interface ProfileLinkRepository extends FilterableRepository<
  ProfileLink,
  CreateProfileLinkInput,
  UpdateProfileLinkInput,
  ProfileLinkFilter
> {
  find_by_profile_id(
    profile_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<ProfileLink>;
}
