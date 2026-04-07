import type {
  CreateQualificationInput,
  Qualification,
  QualificationHolderType,
  UpdateQualificationInput,
} from "../../../../entities/Qualification";
import type { PaginatedAsyncResult } from "../../../../types/Result";
import type { QueryOptions, Repository } from "./Repository";

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
  UpdateQualificationInput,
  QualificationFilter
> {
  find_by_holder(
    holder_type: QualificationHolderType,
    holder_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Qualification>;
  find_active_qualifications(
    options?: QueryOptions,
  ): PaginatedAsyncResult<Qualification>;
}
