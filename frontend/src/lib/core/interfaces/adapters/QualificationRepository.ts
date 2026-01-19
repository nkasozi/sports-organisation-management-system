import type {
  Qualification,
  CreateQualificationInput,
  UpdateQualificationInput,
  QualificationHolderType,
} from "../../entities/Qualification";
import type { Repository, QueryOptions } from "./Repository";
import type { PaginatedAsyncResult } from "../../types/Result";

export interface QualificationFilter {
  holder_type?: QualificationHolderType;
  holder_id?: string;
  certification_level?: string;
  status?: string;
  is_expired?: boolean;
}

export interface QualificationRepository extends Repository<
  Qualification,
  CreateQualificationInput,
  UpdateQualificationInput
> {
  find_by_filter(
    filter: QualificationFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Qualification>;
  find_by_holder(
    holder_type: QualificationHolderType,
    holder_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Qualification>;
  find_active_qualifications(
    options?: QueryOptions,
  ): PaginatedAsyncResult<Qualification>;
}
