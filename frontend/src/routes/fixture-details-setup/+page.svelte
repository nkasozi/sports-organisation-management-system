<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import EntityCrudWrapper from "$lib/presentation/components/EntityCrudWrapper.svelte";
  import { get_fixture_use_cases } from "$lib/core/usecases/FixtureUseCases";
  import { get_jersey_color_use_cases } from "$lib/core/usecases/JerseyColorUseCases";
  import { get_official_use_cases } from "$lib/core/usecases/OfficialUseCases";
  import { get_game_official_role_use_cases } from "$lib/core/usecases/GameOfficialRoleUseCases";
  import type { OfficialAssignment } from "$lib/core/entities/FixtureDetailsSetup";

  const fixture_use_cases = get_fixture_use_cases();
  const jersey_color_use_cases = get_jersey_color_use_cases();
  const official_use_cases = get_official_use_cases();
  const game_official_role_use_cases = get_game_official_role_use_cases();

  let initial_view: "list" | "create" | "edit" = "list";
  let initial_create_data: Record<string, unknown> | null = null;
  let is_ready: boolean = false;
  let after_save_redirect_url: string | null = null;

  async function load_auto_populated_data(
    fixture_id: string,
  ): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = { fixture_id };

    const fixture_result = await fixture_use_cases.get_by_id(fixture_id);
    if (!fixture_result.success || !fixture_result.data) {
      return result;
    }

    const fixture = fixture_result.data;

    const [
      home_jerseys_result,
      away_jerseys_result,
      official_jerseys_result,
      officials_result,
      roles_result,
    ] = await Promise.all([
      jersey_color_use_cases.list_jerseys_by_entity(
        "team",
        fixture.home_team_id,
      ),
      jersey_color_use_cases.list_jerseys_by_entity(
        "team",
        fixture.away_team_id,
      ),
      jersey_color_use_cases.list({
        holder_type: "competition_official",
        holder_id: fixture.competition_id,
      }),
      official_use_cases.list({}, { page_number: 1, page_size: 100 }),
      game_official_role_use_cases.list({}, { page_number: 1, page_size: 100 }),
    ]);

    if (
      home_jerseys_result.success &&
      home_jerseys_result.data?.items?.length
    ) {
      result.home_team_jersey_id = home_jerseys_result.data.items[0].id;
    }

    if (
      away_jerseys_result.success &&
      away_jerseys_result.data?.items?.length
    ) {
      result.away_team_jersey_id = away_jerseys_result.data.items[0].id;
    }

    if (
      official_jerseys_result.success &&
      official_jerseys_result.data?.items?.length
    ) {
      result.official_jersey_id = official_jerseys_result.data.items[0].id;
    } else {
      const all_official_jerseys_result = await jersey_color_use_cases.list({
        holder_type: "competition_official",
      });
      if (
        all_official_jerseys_result.success &&
        all_official_jerseys_result.data?.items?.length
      ) {
        result.official_jersey_id =
          all_official_jerseys_result.data.items[0].id;
      }
    }

    const officials = officials_result.success
      ? officials_result.data || []
      : [];
    const roles = roles_result.success ? roles_result.data || [] : [];

    if (officials.length > 0 && roles.length > 0) {
      const assigned_officials: OfficialAssignment[] = [];
      const used_official_ids = new Set<string>();

      for (const role of roles) {
        const available_official = officials.find(
          (o) => !used_official_ids.has(o.id),
        );
        if (available_official) {
          assigned_officials.push({
            official_id: available_official.id,
            role_id: role.id,
          });
          used_official_ids.add(available_official.id);
        }
      }

      if (assigned_officials.length > 0) {
        result.assigned_officials = assigned_officials;
      }
    }

    return result;
  }

  onMount(async () => {
    const fixture_id = $page.url.searchParams.get("fixture_id");

    if (fixture_id) {
      initial_view = "create";
      initial_create_data = await load_auto_populated_data(fixture_id);
      after_save_redirect_url = "/live-games";
    }

    is_ready = true;
  });
</script>

{#if is_ready}
  <EntityCrudWrapper
    entity_type="FixtureDetailsSetup"
    {initial_view}
    {initial_create_data}
    {after_save_redirect_url}
  />
{:else}
  <div class="flex items-center justify-center py-12">
    <div
      class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
    ></div>
  </div>
{/if}
