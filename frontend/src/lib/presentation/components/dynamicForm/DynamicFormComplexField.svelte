<script lang="ts">
  import type { FieldMetadata } from "$lib/core/entities/BaseEntity";
  import type {
    FormatType,
    LeagueConfig,
  } from "$lib/core/entities/CompetitionFormat";
  import type { DynamicFormFieldCallbacks } from "$lib/presentation/logic/dynamicFormComponentTypes";

  import CompetitionFormatStageTemplateArray from "../competition/CompetitionFormatStageTemplateArray.svelte";
  import OfficialAssignmentArray from "../OfficialAssignmentArray.svelte";

  export let field: FieldMetadata;
  export let value: unknown;
  export let form_data: Record<string, any> = {};
  export let is_read_only: boolean = false;
  export let validation_error: string = "";
  export let validation_errors: Record<string, string> = {};
  export let callbacks: DynamicFormFieldCallbacks;
</script>

{#if field.field_type === "official_assignment_array"}
  <OfficialAssignmentArray
    assignments={Array.isArray(value) ? value : []}
    disabled={is_read_only}
    organization_id={form_data["organization_id"] || ""}
    errors={validation_errors}
    on:change={(event) =>
      callbacks.handle_official_assignments_change(
        field.field_name,
        event.detail.assignments,
      )}
  />
{:else}
  <CompetitionFormatStageTemplateArray
    stage_templates={Array.isArray(value) ? value : []}
    format_type={(form_data["format_type"] as FormatType | undefined) ??
      "league"}
    league_config={(form_data["league_config"] as
      | LeagueConfig
      | null
      | undefined) ?? null}
    disabled={is_read_only}
    error={validation_error}
    on:change={(event) =>
      callbacks.set_managed_value(
        field.field_name,
        event.detail.stage_templates,
      )}
  />
{/if}
