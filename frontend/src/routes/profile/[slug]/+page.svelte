<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import { get_player_full_name } from "$lib/core/entities/Player";
    import {
        get_fixture_use_cases,
        get_player_position_use_cases,
        get_player_profile_use_cases,
        get_player_team_membership_use_cases,
        get_player_use_cases,
        get_profile_link_use_cases,
        get_team_use_cases,
    } from "$lib/infrastructure/registry/useCaseFactories";
    import PlayerPublicProfilePage from "$lib/presentation/components/profile/PlayerPublicProfilePage.svelte";
    import PublicProfilePageShell from "$lib/presentation/components/profile/PublicProfilePageShell.svelte";
    import {
        load_player_public_profile_page_data,
        PLAYER_PUBLIC_PROFILE_LOAD_ERROR_KIND,
        type PlayerPublicProfileLoadError,
        type PlayerPublicProfilePageData,
    } from "$lib/presentation/logic/playerPublicProfileDataLoader";

    const PLAYER_PROFILE_TITLE = "Player Profile";
    const PLAYER_PROFILE_NOT_FOUND_TITLE = "Profile Not Found";
    const PLAYER_PROFILE_NOT_FOUND_MESSAGE =
        "The player profile you're looking for doesn't exist or has been removed.";
    const PLAYER_PROFILE_ERROR_TITLE_RESTRICTED = "Access Restricted";
    const PLAYER_PROFILE_ERROR_TITLE_UNAVAILABLE = "Profile Unavailable";

    const player_public_profile_dependencies = {
        profile_use_cases: get_player_profile_use_cases(),
        player_use_cases: get_player_use_cases(),
        team_use_cases: get_team_use_cases(),
        membership_use_cases: get_player_team_membership_use_cases(),
        fixture_use_cases: get_fixture_use_cases(),
        position_use_cases: get_player_position_use_cases(),
        profile_link_use_cases: get_profile_link_use_cases(),
    };

    let page_data: PlayerPublicProfilePageData | null = null;
    let loading = true;
    let not_found = false;
    let error_title = PLAYER_PROFILE_ERROR_TITLE_RESTRICTED;
    let error_message = "";
    let last_requested_slug = "";
    let active_request_identifier = 0;

    function apply_player_profile_error(
        error: PlayerPublicProfileLoadError,
    ): void {
        if (error.kind === PLAYER_PUBLIC_PROFILE_LOAD_ERROR_KIND.not_found) {
            not_found = true;
            return;
        }

        error_title =
            error.kind === PLAYER_PUBLIC_PROFILE_LOAD_ERROR_KIND.restricted
                ? PLAYER_PROFILE_ERROR_TITLE_RESTRICTED
                : PLAYER_PROFILE_ERROR_TITLE_UNAVAILABLE;
        error_message = error.message;
    }

    async function load_player_profile_page(slug: string): Promise<void> {
        const request_identifier = active_request_identifier + 1;
        active_request_identifier = request_identifier;
        last_requested_slug = slug;
        loading = true;
        not_found = false;
        error_message = "";
        page_data = null;

        const result = await load_player_public_profile_page_data({
            slug,
            dependencies: player_public_profile_dependencies,
        });
        if (request_identifier !== active_request_identifier) {
            return;
        }

        loading = false;
        if (!result.success) {
            apply_player_profile_error(result.error);
            return;
        }

        page_data = result.data;
    }

    $: current_slug = $page.params.slug;

    $: if (browser && !current_slug) {
        loading = false;
        not_found = true;
        error_message = "";
        page_data = null;
    }

    $: if (browser && current_slug && current_slug !== last_requested_slug) {
        void load_player_profile_page(current_slug);
    }
</script>

<svelte:head>
    <title>
        {page_data
            ? `${get_player_full_name(page_data.player)} - ${PLAYER_PROFILE_TITLE}`
            : PLAYER_PROFILE_TITLE}
    </title>
</svelte:head>

<PublicProfilePageShell
    {loading}
    {not_found}
    {error_title}
    {error_message}
    not_found_title={PLAYER_PROFILE_NOT_FOUND_TITLE}
    not_found_message={PLAYER_PROFILE_NOT_FOUND_MESSAGE}
    home_href="/"
>
    {#if page_data}
        <div class="max-w-4xl mx-auto px-4 py-8 sm:py-12">
            <PlayerPublicProfilePage {...page_data} />
        </div>
    {/if}
</PublicProfilePageShell>
