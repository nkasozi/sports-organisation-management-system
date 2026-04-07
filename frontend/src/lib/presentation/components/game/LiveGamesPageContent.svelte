<script lang="ts">
    import type { Fixture } from "$lib/core/entities/Fixture";
    import type { Organization } from "$lib/core/entities/Organization";
    import type { PreFlightCheck } from "$lib/core/services/fixtureStartChecks";

    import LiveGamesBody from "./LiveGamesBody.svelte";
    import LiveGamesHeader from "./LiveGamesHeader.svelte";
    import LiveGamesPermissionNotice from "./LiveGamesPermissionNotice.svelte";
    import LiveGameStartConfirmationDialog from "./LiveGameStartConfirmationDialog.svelte";

    export let organizations: Organization[] = [];
    export let selected_organization_id = "";
    export let can_change_organizations: boolean;
    export let is_loading_fixtures: boolean;
    export let on_organization_change: () => Promise<void>;
    export let permission_info_message = "";
    export let is_loading: boolean;
    export let error_message = "";
    export let incomplete_fixtures: Fixture[] = [];
    export let can_start_games: boolean;
    export let team_names: Record<string, string> = {};
    export let team_logo_urls: Record<string, string> = {};
    export let competition_names: Record<string, string> = {};
    export let sport_names: Record<string, string> = {};
    export let current_checks: Record<string, PreFlightCheck[]> = {};
    export let is_starting: Record<string, boolean> = {};
    export let on_start_click: (fixture: Fixture) => Promise<void>;
    export let pending_start_fixture: Fixture | null = null;
    export let on_cancel_start: () => void;
    export let on_confirm_start: () => void;
</script>

<div class="container mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-8">
    <LiveGamesHeader
        {organizations}
        bind:selected_organization_id
        {can_change_organizations}
        {is_loading_fixtures}
        {on_organization_change}
    />
    <LiveGamesPermissionNotice message={permission_info_message} />
    <LiveGamesBody
        {is_loading}
        {error_message}
        has_organizations={organizations.length > 0}
        {is_loading_fixtures}
        {incomplete_fixtures}
        {can_start_games}
        {team_names}
        {team_logo_urls}
        {competition_names}
        {sport_names}
        {current_checks}
        {is_starting}
        {on_start_click}
    />
</div>

<LiveGameStartConfirmationDialog
    fixture={pending_start_fixture}
    {team_names}
    on_cancel={on_cancel_start}
    on_confirm={on_confirm_start}
/>
