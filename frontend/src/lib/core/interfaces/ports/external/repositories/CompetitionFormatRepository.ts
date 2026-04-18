import type {
  CompetitionFormat,
  CreateCompetitionFormatInput,
  FormatType,
  UpdateCompetitionFormatInput,
} from "../../../../entities/CompetitionFormat";
import type { AsyncResult } from "../../../../types/Result";
import type { FilterableRepository } from "./Repository";

const COMPETITION_FORMAT_NOT_FOUND_BY_CODE_ERROR_PREFIX =
  "Competition format not found by code";

export function build_competition_format_not_found_by_code_error(
  code: string,
): string {
  return `${COMPETITION_FORMAT_NOT_FOUND_BY_CODE_ERROR_PREFIX}: ${code}`;
}

export function is_competition_format_not_found_by_code_error(
  error: string,
  code: string,
): boolean {
  return error === build_competition_format_not_found_by_code_error(code);
}

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
  find_by_code(code: string): AsyncResult<CompetitionFormat>;
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
