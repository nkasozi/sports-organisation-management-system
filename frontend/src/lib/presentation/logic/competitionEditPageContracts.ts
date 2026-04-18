import type { CompetitionFormat } from "$lib/core/entities/CompetitionFormat";
import type { Sport } from "$lib/core/entities/Sport";

export type CompetitionEditSelectedFormatState =
  | { status: "missing" }
  | { status: "present"; competition_format: CompetitionFormat };

export type CompetitionEditSelectedSportState =
  | { status: "missing" }
  | { status: "present"; sport: Sport };
