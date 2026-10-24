<script lang="ts">
    import { onMount } from "svelte";

    import { page } from "$app/stores";
    import {
        get_competition_use_cases,
        get_fixture_use_cases,
        get_game_official_role_use_cases,
        get_jersey_color_use_cases,
        get_official_use_cases,
        get_organization_use_cases,
        get_sport_use_cases,
    } from "$lib/infrastructure/registry/useCaseFactories";
    import EntityCrudWrapper from "$lib/presentation/components/EntityCrudWrapper.svelte";
    import { load_fixture_details_setup_auto_populated_data } from "$lib/presentation/logic/fixtureDetailsSetupAutoPopulate";
    import { build_live_games_resume_start_url } from "$lib/presentation/logic/liveGamesStartResume";

    const fixture_use_cases = get_fixture_use_cases();
    const jersey_color_use_cases = get_jersey_color_use_cases();
    const official_use_cases = get_official_use_cases();
    const game_official_role_use_cases = get_game_official_role_use_cases();

    let initial_view: "list" | "create" | "edit" = "list";
    let initial_create_data: Record<string, unknown> = {};
    let is_ready: boolean = false;
    let after_save_redirect_url = "";
    let info_message = "";

    async function load_auto_populated_data(
        fixture_id: string,
    ): Promise<Record<string, unknown>> {
        return load_fixture_details_setup_auto_populated_data(fixture_id, {
            fixture_use_cases,
            jersey_color_use_cases,
            official_use_cases,
            game_official_role_use_cases,
            competition_use_cases: get_competition_use_cases(),
            organization_use_cases: get_organization_use_cases(),
            sport_use_cases: get_sport_use_cases(),
        });
    }

    onMount(async () => {
        const fixture_id = $page.url.searchParams.get("fixture_id");

        if (fixture_id) {
            initial_view = "create";
            initial_create_data = await load_auto_populated_data(fixture_id);
            after_save_redirect_url = build_live_games_resume_start_url(
                fixture_id,
                String(initial_create_data.organization_id ?? ""),
            );
            info_message =
                "No fixture details were found for this game. Please review the pre-filled details below (jersey colors and officials) and save to continue starting the game.";
        }

        is_ready = true;
    });
</script>

<svelte:head>
    <title>Fixture Details Setup - Sports Management</title>
</svelte:head>

{#if is_ready}
    <EntityCrudWrapper
        entity_type="FixtureDetailsSetup"
        {initial_view}
        {initial_create_data}
        {after_save_redirect_url}
        {info_message}
    />
{:else}
    <div class="flex items-center justify-center py-12">
        <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
        ></div>
    </div>
{/if}
