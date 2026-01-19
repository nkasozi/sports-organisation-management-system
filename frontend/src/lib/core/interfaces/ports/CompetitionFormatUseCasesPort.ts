import type {
  CompetitionFormat,
  CreateCompetitionFormatInput,
  UpdateCompetitionFormatInput,
  FormatType,
} from "../../entities/CompetitionFormat";
import type { CompetitionFormatFilter } from "../adapters/CompetitionFormatRepository";
import type { AsyncResult } from "../../types/Result";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface CompetitionFormatUseCasesPort extends BaseUseCasesPort<
  CompetitionFormat,
  CreateCompetitionFormatInput,
  UpdateCompetitionFormatInput,
  CompetitionFormatFilter
> {
  get_format_by_code(code: string): AsyncResult<CompetitionFormat | null>;
  list_formats_by_type(
    format_type: FormatType,
  ): AsyncResult<CompetitionFormat[]>;
  list_active_formats(): AsyncResult<CompetitionFormat[]>;
}
