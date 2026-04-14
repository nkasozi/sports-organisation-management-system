import type {
  CreateProfileLinkInput,
  ProfileLink,
  UpdateProfileLinkInput,
} from "../../../../entities/ProfileLink";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type { PaginatedAsyncResult } from "../../../../types/Result";
import type { FilterableRepository, QueryOptions } from "./Repository";

export interface ProfileLinkFilter {
  profile_id?: ScalarValueInput<ProfileLink["profile_id"]>;
  platform?: string;
  status?: ProfileLink["status"];
}

export interface ProfileLinkRepository extends FilterableRepository<
  ProfileLink,
  CreateProfileLinkInput,
  UpdateProfileLinkInput,
  ProfileLinkFilter
> {
  find_by_profile_id(
    profile_id: ScalarValueInput<ProfileLink["profile_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<ProfileLink>;
}
