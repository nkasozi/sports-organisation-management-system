<script lang="ts">
    import type { Competition } from "$lib/core/entities/Competition";
    import type { Fixture } from "$lib/core/entities/Fixture";
    import type { Team } from "$lib/core/entities/Team";

    import DashboardAccessNotice from "./DashboardAccessNotice.svelte";
    import DashboardHeroBanner from "./DashboardHeroBanner.svelte";
    import DashboardQuickActions from "./DashboardQuickActions.svelte";
    import DashboardRecentCompetitionsPanel from "./DashboardRecentCompetitionsPanel.svelte";
    import DashboardStatsGrid from "./DashboardStatsGrid.svelte";
    import DashboardUpcomingGamesPanel from "./DashboardUpcomingGamesPanel.svelte";

    export let loading: boolean;
    export let access_denial_message: string;
    export let organization_name: string;
    export let organization_tagline: string;
    export let user_is_super_admin: boolean;
    export let user_has_org_admin_access: boolean;
    export let is_resetting: boolean;
    export let stats: {
        organizations: number;
        competitions: number;
        teams: number;
        players: number;
    };
    export let recent_competitions: Competition[];
    export let upcoming_fixtures: Fixture[];
    export let teams_map: Map<string, Team>;
    export let competition_names: Record<string, string>;
    export let sport_names: Record<string, string>;
    export let competition_sport_names: Record<string, string>;
    export let on_reset: () => void;
    export let on_dismiss_access_denial: () => void;

    function get_team_name(team_id: string): string {
        const team = teams_map.get(team_id);
        return team?.short_name || team?.name || "Unknown";
    }

    function get_competition_name(competition_id: string): string {
        return competition_names[competition_id] || "Unknown Competition";
    }

    function get_sport_name(competition_id: string): string {
        return sport_names[competition_id] || "Unknown Sport";
    }

    function get_sport_name_for_competition(competition_id: string): string {
        return competition_sport_names[competition_id] || "Unknown Sport";
    }
</script>

{#if access_denial_message}
    <DashboardAccessNotice
        message={access_denial_message}
        on_dismiss={on_dismiss_access_denial}
    />
{/if}

<div class="space-y-6">
    <DashboardHeroBanner
        {organization_name}
        {organization_tagline}
        {user_is_super_admin}
        {is_resetting}
        {on_reset}
    />
    <DashboardStatsGrid {loading} {user_has_org_admin_access} {stats} />
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardRecentCompetitionsPanel
            {loading}
            {recent_competitions}
            {user_has_org_admin_access}
            {get_sport_name_for_competition}
        />
        <DashboardUpcomingGamesPanel
            {loading}
            {upcoming_fixtures}
            {user_has_org_admin_access}
            {get_team_name}
            {get_competition_name}
            {get_sport_name}
        />
    </div>
    <DashboardQuickActions visible={user_has_org_admin_access} />
</div>
