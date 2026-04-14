import type {
  CompetitionFormatStageTemplate,
  FormatType,
  LeagueConfig,
} from "../../core/entities/CompetitionFormat";
import type { ScalarInput } from "../../core/types/DomainScalars";
import type { StageType } from "../../core/entities/CompetitionStage";
import { create_default_stage_templates } from "../../core/entities/CompetitionStage";

type EditableCompetitionFormatStageTemplate = ScalarInput<CompetitionFormatStageTemplate>;

export function build_stage_template_defaults(
  format_type: FormatType,
  league_config: LeagueConfig | null = null,
): EditableCompetitionFormatStageTemplate[] {
  return create_default_stage_templates(
    format_type,
    league_config ?? undefined,
  ).map((template, index) => ({
    name: template.name,
    stage_type: template.stage_type,
    stage_order: index + 1,
  }));
}

export function create_empty_stage_template(
  stage_order: number,
): EditableCompetitionFormatStageTemplate {
  return {
    name: `Stage ${stage_order}`,
    stage_type: "custom",
    stage_order,
  };
}

export function add_stage_template(
  stage_templates: EditableCompetitionFormatStageTemplate[],
): EditableCompetitionFormatStageTemplate[] {
  return normalize_stage_template_order([
    ...stage_templates,
    create_empty_stage_template(stage_templates.length + 1),
  ]);
}

export function update_stage_template_at_index(
  stage_templates: EditableCompetitionFormatStageTemplate[],
  template_index: number,
  updates: Partial<EditableCompetitionFormatStageTemplate>,
): EditableCompetitionFormatStageTemplate[] {
  return normalize_stage_template_order(
    stage_templates.map((template, index) =>
      index === template_index
        ? {
            ...template,
            ...updates,
          }
        : template,
    ),
  );
}

export function remove_stage_template_at_index(
  stage_templates: EditableCompetitionFormatStageTemplate[],
  template_index: number,
): EditableCompetitionFormatStageTemplate[] {
  return normalize_stage_template_order(
    stage_templates.filter((_, index) => index !== template_index),
  );
}

export function normalize_stage_template_order(
  stage_templates: EditableCompetitionFormatStageTemplate[],
): EditableCompetitionFormatStageTemplate[] {
  return stage_templates.map((template, index) => ({
    name: template.name,
    stage_type: template.stage_type,
    stage_order: index + 1,
  }));
}

export function is_stage_type(value: string): value is StageType {
  return [
    "group_stage",
    "knockout_stage",
    "league_stage",
    "one_off_stage",
    "custom",
  ].includes(value);
}
