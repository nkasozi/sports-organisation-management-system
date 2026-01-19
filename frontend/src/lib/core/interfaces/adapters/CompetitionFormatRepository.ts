import type { Repository, FilterableRepository } from "./Repository";
import type {
  CompetitionFormat,
  CreateCompetitionFormatInput,
  UpdateCompetitionFormatInput,
  FormatType,
} from "../../entities/CompetitionFormat";

export interface CompetitionFormatFilter {
  name_contains?: string;
  code?: string;
  format_type?: FormatType;
  auto_generate_fixtures?: boolean;
  status?: CompetitionFormat["status"];
}

export interface CompetitionFormatRepository extends FilterableRepository<
  CompetitionFormat,
  CreateCompetitionFormatInput,
  UpdateCompetitionFormatInput,
  CompetitionFormatFilter
> {
  find_by_format_type(format_type: FormatType): Promise<CompetitionFormat[]>;
  find_by_code(code: string): Promise<CompetitionFormat | null>;
  find_active_formats(): Promise<CompetitionFormat[]>;
}

export type {
  CompetitionFormat,
  CreateCompetitionFormatInput,
  UpdateCompetitionFormatInput,
};
