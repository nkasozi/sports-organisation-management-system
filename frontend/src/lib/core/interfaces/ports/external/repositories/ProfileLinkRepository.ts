import type {
  CreateProfileLinkInput,
  ProfileLink,
  UpdateProfileLinkInput,
} from "../../../../entities/ProfileLink";
import type { PaginatedAsyncResult } from "../../../../types/Result";
import type { FilterableRepository, QueryOptions } from "./Repository";

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
