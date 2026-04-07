import {
  derive_competition_status,
  get_competition_status_display,
  type UpdateCompetitionInput,
} from "$lib/core/entities/Competition";
import type { CompetitionFormat } from "$lib/core/entities/CompetitionFormat";
import type { Organization } from "$lib/core/entities/Organization";
import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";
import type { SelectOption } from "$lib/presentation/components/ui/SelectField.svelte";

export function create_competition_workspace_options(command: {
  organizations: Organization[];
  competition_formats: CompetitionFormat[];
}): {
  organization_options: SelectOption[];
  competition_format_options: SelectOption[];
} {
  return {
    organization_options: command.organizations.map(
      (organization: Organization) => ({
        value: organization.id,
        label: organization.name,
      }),
    ) as SelectOption[],
    competition_format_options: command.competition_formats.map(
      (competition_format: CompetitionFormat) => ({
        value: competition_format.id,
        label: competition_format.name,
      }),
    ) as SelectOption[],
  };
}

export function derive_competition_workspace_status(command: {
  form_data: UpdateCompetitionInput;
}): {
  derived_status: ReturnType<typeof derive_competition_status> | "upcoming";
  status_display: ReturnType<typeof get_competition_status_display>;
} {
  const derived_status =
    command.form_data.start_date && command.form_data.end_date
      ? derive_competition_status(
          command.form_data.start_date,
          command.form_data.end_date,
        )
      : "upcoming";
  return {
    derived_status,
    status_display: get_competition_status_display(derived_status),
  };
}

export function create_competition_workspace_filters(competition_id: string): {
  competition_stage_filter: SubEntityFilter;
  official_jersey_filter: SubEntityFilter;
} {
  return {
    competition_stage_filter: {
      foreign_key_field: "competition_id",
      foreign_key_value: competition_id,
    } as SubEntityFilter,
    official_jersey_filter: {
      foreign_key_field: "holder_id",
      foreign_key_value: competition_id,
      holder_type_field: "holder_type",
      holder_type_value: "competition_official",
    } as SubEntityFilter,
  };
}
