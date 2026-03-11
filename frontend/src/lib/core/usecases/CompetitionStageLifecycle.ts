import type { CompetitionFormatRepository } from "../interfaces/ports";
import type { CompetitionStageRepository } from "../interfaces/ports";
import type { FixtureRepository } from "../interfaces/ports";
import type { AsyncResult } from "../types/Result";
import { create_failure_result, create_success_result } from "../types/Result";
import type { CompetitionFormat } from "../entities/CompetitionFormat";

export interface CompetitionStageLifecycle {
  ensure_stages_for_competition(
    competition_id: string,
    competition_format_id: string,
  ): Promise<AsyncResult<boolean>>;
  can_replace_stages_for_competition(
    competition_id: string,
  ): Promise<AsyncResult<boolean>>;
  replace_stages_for_competition(
    competition_id: string,
    competition_format_id: string,
  ): Promise<AsyncResult<boolean>>;
}

export function create_competition_stage_lifecycle(
  competition_format_repository: CompetitionFormatRepository,
  competition_stage_repository: CompetitionStageRepository,
  fixture_repository: FixtureRepository,
): CompetitionStageLifecycle {
  return {
    async ensure_stages_for_competition(
      competition_id: string,
      competition_format_id: string,
    ): Promise<AsyncResult<boolean>> {
      const existing_stages_result =
        await competition_stage_repository.find_by_competition(competition_id, {
          page_size: 100,
        });
      if (!existing_stages_result.success) {
        return create_failure_result(existing_stages_result.error);
      }

      const existing_stages = existing_stages_result.data?.items ?? [];
      if (existing_stages.length > 0) {
        return create_success_result(true);
      }

      return create_stages_from_format(
        competition_id,
        competition_format_id,
        competition_format_repository,
        competition_stage_repository,
      );
    },

    async can_replace_stages_for_competition(
      competition_id: string,
    ): Promise<AsyncResult<boolean>> {
      const fixtures_result = await fixture_repository.find_by_competition(
        competition_id,
        { page_size: 1 },
      );
      if (!fixtures_result.success) {
        return create_failure_result(fixtures_result.error);
      }

      const fixture_count = fixtures_result.data?.total_count ?? 0;
      if (fixture_count > 0) {
        return create_failure_result(
          "Cannot change competition format after fixtures have been created",
        );
      }

      return create_success_result(true);
    },

    async replace_stages_for_competition(
      competition_id: string,
      competition_format_id: string,
    ): Promise<AsyncResult<boolean>> {
      const can_replace_result =
        await this.can_replace_stages_for_competition(competition_id);
      if (!can_replace_result.success) {
        return can_replace_result;
      }

      const existing_stages_result =
        await competition_stage_repository.find_by_competition(competition_id, {
          page_size: 100,
        });
      if (!existing_stages_result.success) {
        return create_failure_result(existing_stages_result.error);
      }

      const existing_stages = existing_stages_result.data?.items ?? [];
      for (const stage of existing_stages) {
        const delete_result = await competition_stage_repository.delete_by_id(
          stage.id,
        );
        if (!delete_result.success) {
          return create_failure_result(delete_result.error);
        }
      }

      return create_stages_from_format(
        competition_id,
        competition_format_id,
        competition_format_repository,
        competition_stage_repository,
      );
    },
  };
}

async function create_stages_from_format(
  competition_id: string,
  competition_format_id: string,
  competition_format_repository: CompetitionFormatRepository,
  competition_stage_repository: CompetitionStageRepository,
): Promise<AsyncResult<boolean>> {
  if (!competition_id || competition_id.trim().length === 0) {
    return create_failure_result("Competition ID is required");
  }
  if (!competition_format_id || competition_format_id.trim().length === 0) {
    return create_failure_result("Competition format ID is required");
  }

  const format_result = await competition_format_repository.find_by_id(
    competition_format_id,
  );
  if (!format_result.success || !format_result.data) {
    return create_failure_result("Competition format not found");
  }

  const stage_templates = get_stage_templates_for_format(format_result.data);
  if (stage_templates.length === 0) {
    return create_failure_result(
      `Competition format '${format_result.data.name}' has no stage templates`,
    );
  }

  for (const template of stage_templates) {
    const create_result = await competition_stage_repository.create({
      competition_id,
      name: template.name,
      stage_type: template.stage_type,
      stage_order: template.stage_order,
      status: "active",
    });
    if (!create_result.success) {
      return create_failure_result(create_result.error);
    }
  }

  return create_success_result(true);
}

function get_stage_templates_for_format(
  competition_format: CompetitionFormat,
): CompetitionFormat["stage_templates"] {
  return [...competition_format.stage_templates].sort(
    (left, right) => left.stage_order - right.stage_order,
  );
}
