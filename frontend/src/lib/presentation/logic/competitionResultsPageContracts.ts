import type { Competition } from "$lib/core/entities/Competition";
import type { CompetitionFormat } from "$lib/core/entities/CompetitionFormat";
import type { Organization } from "$lib/core/entities/Organization";
import type { UserRole } from "$lib/core/interfaces/ports";

export type CompetitionResultsCurrentProfile = {
  organization_id?: string;
  role?: UserRole;
};

export type CompetitionResultsProfileState =
  | { status: "missing" }
  | { status: "present"; profile: CompetitionResultsCurrentProfile };

export type CompetitionResultsOrganizationState =
  | { status: "missing" }
  | { status: "present"; organization: Organization };

export type CompetitionResultsSelectedCompetitionState =
  | { status: "missing" }
  | { status: "present"; competition: Competition };

export type CompetitionResultsCompetitionFormatState =
  | { status: "missing" }
  | { status: "present"; competition_format: CompetitionFormat };
