import type {
  CompetitionFormat,
  CreateCompetitionFormatInput,
  FormatType,
  UpdateCompetitionFormatInput,
} from "../../../../entities/CompetitionFormat";
import type { AsyncResult } from "../../../../types/Result";
import type { FilterableRepository } from "./Repository";

export interface CompetitionFormatFilter {
  name_contains?: string;
  code?: string;
  format_type?: FormatType;
  auto_generate_fixtures?: boolean;
  status?: CompetitionFormat["status"];
  organization_id?: CompetitionFormat["organization_id"];
}

export interface CompetitionFormatRepository extends FilterableRepository<
  CompetitionFormat,
  CreateCompetitionFormatInput,
  UpdateCompetitionFormatInput,
  CompetitionFormatFilter
> {
  find_by_format_type(
    format_type: FormatType,
  ): AsyncResult<CompetitionFormat[]>;
  find_by_code(code: string): AsyncResult<CompetitionFormat | null>;
  find_active_formats(): AsyncResult<CompetitionFormat[]>;
  find_by_organization(
    organization_id: CompetitionFormat["organization_id"],
    options?: import("./Repository").QueryOptions,
  ): import("../../../../types/Result").PaginatedAsyncResult<CompetitionFormat>;
}

export type {
  CompetitionFormat,
  CreateCompetitionFormatInput,
  UpdateCompetitionFormatInput,
};
