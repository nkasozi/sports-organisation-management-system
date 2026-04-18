<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import {
        get_competition_use_cases,
        get_fixture_use_cases,
        get_profile_link_use_cases,
        get_team_profile_use_cases,
        get_team_use_cases,
    } from "$lib/infrastructure/registry/useCaseFactories";
    import PublicProfilePageShell from "$lib/presentation/components/profile/PublicProfilePageShell.svelte";
    import TeamPublicProfilePage from "$lib/presentation/components/profile/TeamPublicProfilePage.svelte";
    import {
        load_team_public_profile_page_data,
        TEAM_PUBLIC_PROFILE_LOAD_ERROR_KIND,
        type TeamPublicProfileLoadError,
        type TeamPublicProfilePageData,
    } from "$lib/presentation/logic/teamPublicProfileDataLoader";

    const TEAM_PROFILE_TITLE_SUFFIX = "Public Profile";
    const TEAM_PROFILE_NOT_FOUND_TITLE = "Team Profile Not Found";
    const TEAM_PROFILE_NOT_FOUND_MESSAGE =
        "The team profile you're looking for doesn't exist or has been removed.";
    const TEAM_PROFILE_ERROR_TITLE_RESTRICTED = "Private Profile";
    const TEAM_PROFILE_ERROR_TITLE_UNAVAILABLE = "Profile Unavailable";

    const team_public_profile_dependencies = {
        profile_use_cases: get_team_profile_use_cases(),
        team_use_cases: get_team_use_cases(),
        fixture_use_cases: get_fixture_use_cases(),
        competition_use_cases: get_competition_use_cases(),
        profile_link_use_cases: get_profile_link_use_cases(),
    };

    type TeamPublicProfilePageDataState =
        | { status: "empty" }
        | { status: "present"; page_data: TeamPublicProfilePageData };

    let page_data_state: TeamPublicProfilePageDataState = {
        status: "empty",
    };
    let loading = true;
    let not_found = false;
    let error_title = TEAM_PROFILE_ERROR_TITLE_RESTRICTED;
    let error_message = "";
    let last_requested_slug = "";
    let active_request_identifier = 0;

    function apply_team_profile_error(error: TeamPublicProfileLoadError): void {
        if (error.kind === TEAM_PUBLIC_PROFILE_LOAD_ERROR_KIND.not_found) {
            not_found = true;
            return;
        }

        error_title =
            error.kind === TEAM_PUBLIC_PROFILE_LOAD_ERROR_KIND.restricted
                ? TEAM_PROFILE_ERROR_TITLE_RESTRICTED
                : TEAM_PROFILE_ERROR_TITLE_UNAVAILABLE;
        error_message = error.message;
    }

    async function load_team_profile_page(slug: string): Promise<void> {
        const request_identifier = active_request_identifier + 1;
        active_request_identifier = request_identifier;
        last_requested_slug = slug;
        loading = true;
        not_found = false;
        error_message = "";
        page_data_state = { status: "empty" };

        const result = await load_team_public_profile_page_data({
            slug,
            dependencies: team_public_profile_dependencies,
        });
        if (request_identifier !== active_request_identifier) {
            return;
        }

        loading = false;
        if (!result.success) {
            apply_team_profile_error(result.error);
            return;
        }

        page_data_state = { status: "present", page_data: result.data };
    }

    $: current_slug = $page.params.slug;

    $: if (browser && !current_slug) {
        loading = false;
        not_found = true;
        error_message = "";
        page_data_state = { status: "empty" };
    }

    $: if (browser && current_slug && current_slug !== last_requested_slug) {
        void load_team_profile_page(current_slug);
    }
</script>

<svelte:head>
    <title
        >{page_data_state.status === "present"
            ? page_data_state.page_data.team.name
            : "Team Profile"} - {TEAM_PROFILE_TITLE_SUFFIX}</title
    >
</svelte:head>

<PublicProfilePageShell
    {loading}
    {not_found}
    {error_title}
    {error_message}
    background_class="min-h-screen bg-accent-50 dark:bg-accent-900"
    not_found_title={TEAM_PROFILE_NOT_FOUND_TITLE}
    not_found_message={TEAM_PROFILE_NOT_FOUND_MESSAGE}
>
    {#if page_data_state.status === "present"}
        <div class="max-w-4xl mx-auto px-4 py-8 sm:py-12">
            <TeamPublicProfilePage {...page_data_state.page_data} />
        </div>
    {/if}
</PublicProfilePageShell>
