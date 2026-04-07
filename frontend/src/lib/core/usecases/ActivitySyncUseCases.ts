import type { Activity, CreateActivityInput } from "../entities/Activity";
import {
  create_activity_from_competition,
  create_activity_from_fixture,
} from "../entities/Activity";
import type { ActivityCategoryType } from "../entities/ActivityCategory";
import type {
  ActivityCategoryRepository,
  ActivityRepository,
  ActivityUseCasesPort,
  CompetitionRepository,
  FixtureRepository,
  TeamRepository,
} from "../interfaces/ports";
import type { AsyncResult, Result } from "../types/Result";
import { create_failure_result, create_success_result } from "../types/Result";

type ActivitySyncMethods = Pick<
  ActivityUseCasesPort,
  | "sync_competitions_to_activities"
  | "sync_fixtures_to_activities"
  | "find_activity_by_source"
>;

async function find_category_by_type(
  category_repository: ActivityCategoryRepository,
  organization_id: string,
  category_type: ActivityCategoryType,
): Promise<Result<string>> {
  const result = await category_repository.find_by_category_type(
    organization_id,
    category_type,
  );
  if (result.success && result.data?.items && result.data.items.length > 0) {
    return create_success_result(result.data.items[0].id);
  }
  return create_failure_result(
    `No ${category_type} category found for organization: ${organization_id}`,
  );
}

async function upsert_activity(
  activity_repository: ActivityRepository,
  existing_activity: Activity | null,
  activity_input: CreateActivityInput,
  update_fields: Partial<Activity>,
): AsyncResult<boolean> {
  if (existing_activity) {
    const update_result = await activity_repository.update(
      existing_activity.id,
      update_fields,
    );
    return update_result.success
      ? create_success_result(true)
      : create_failure_result(update_result.error);
  }
  const create_result = await activity_repository.create(activity_input);
  return create_result.success
    ? create_success_result(false)
    : create_failure_result(create_result.error);
}

export function create_activity_sync(
  activity_repository: ActivityRepository,
  activity_category_repository: ActivityCategoryRepository,
  competition_repository: CompetitionRepository,
  fixture_repository: FixtureRepository,
  team_repository: TeamRepository,
): ActivitySyncMethods {
  return {
    async sync_competitions_to_activities(organization_id) {
      const category_result = await find_category_by_type(
        activity_category_repository,
        organization_id,
        "competition",
      );
      if (!category_result.success)
        return create_failure_result(
          "Competition category not found. Please ensure default categories are created.",
        );
      const competitions_result =
        await competition_repository.find_by_organization(organization_id);
      if (!competitions_result.success)
        return create_failure_result(competitions_result.error);
      const competitions = competitions_result.data?.items || [];
      let created = 0;
      let updated = 0;
      for (const competition of competitions) {
        const existing_result = await activity_repository.find_by_source(
          "competition",
          competition.id,
        );
        if (!existing_result.success) continue;
        const activity_input = create_activity_from_competition(
          competition.id,
          competition.name,
          competition.start_date,
          competition.end_date,
          organization_id,
          category_result.data,
          competition.location,
        );
        const upsert_result = await upsert_activity(
          activity_repository,
          existing_result.data,
          activity_input,
          {
            title: activity_input.title,
            start_datetime: activity_input.start_datetime,
            end_datetime: activity_input.end_datetime,
            location: activity_input.location,
          } as Partial<Activity>,
        );
        if (upsert_result.success) {
          upsert_result.data ? updated++ : created++;
        }
      }
      return create_success_result({ created, updated });
    },

    async sync_fixtures_to_activities(organization_id, competition_id) {
      console.log("[ActivitySync] Starting fixture sync", {
        event: "fixture_sync_started",
        organization_id,
        competition_id,
      });
      const category_result = await find_category_by_type(
        activity_category_repository,
        organization_id,
        "fixture",
      );
      if (!category_result.success) {
        console.log("[ActivitySync] No fixture category found", {
          event: "fixture_category_missing",
          organization_id,
        });
        return create_failure_result(
          "Fixture category not found. Please ensure default categories are created.",
        );
      }
      const fixtures_result = competition_id
        ? await fixture_repository.find_by_competition(competition_id)
        : await fixture_repository.find_all(undefined, { page_size: 1000 });
      if (!fixtures_result.success) {
        console.log("[ActivitySync] Failed to fetch fixtures", {
          event: "fixture_fetch_failed",
          error: fixtures_result.error,
        });
        return create_failure_result(fixtures_result.error);
      }
      console.log("[ActivitySync] Fixtures found", {
        event: "fixtures_loaded",
        count: fixtures_result.data?.items?.length,
      });
      const fixtures = fixtures_result.data?.items || [];
      let created = 0;
      let updated = 0;
      for (const fixture of fixtures) {
        const existing_result = await activity_repository.find_by_source(
          "fixture",
          fixture.id,
        );
        if (!existing_result.success) continue;
        const home_result = await team_repository.find_by_id(
          fixture.home_team_id,
        );
        const away_result = await team_repository.find_by_id(
          fixture.away_team_id,
        );
        const home_name = home_result.success
          ? home_result.data?.name || "TBD"
          : "TBD";
        const away_name = away_result.success
          ? away_result.data?.name || "TBD"
          : "TBD";
        const fixture_datetime = `${fixture.scheduled_date}T${fixture.scheduled_time || "00:00"}`;
        const activity_input = create_activity_from_fixture(
          fixture.id,
          `${home_name} vs ${away_name}`,
          fixture_datetime,
          fixture.competition_id,
          fixture.home_team_id,
          fixture.away_team_id,
          organization_id,
          category_result.data,
          fixture.venue,
        );
        const upsert_result = await upsert_activity(
          activity_repository,
          existing_result.data,
          activity_input,
          {
            title: activity_input.title,
            start_datetime: activity_input.start_datetime,
            end_datetime: activity_input.end_datetime,
            location: activity_input.location,
            team_ids: activity_input.team_ids,
          } as Partial<Activity>,
        );
        if (upsert_result.success) {
          upsert_result.data ? updated++ : created++;
        }
      }
      return create_success_result({ created, updated });
    },

    async find_activity_by_source(source_type, source_id) {
      return activity_repository.find_by_source(source_type, source_id);
    },
  };
}
