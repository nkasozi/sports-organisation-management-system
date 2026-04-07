<script lang="ts">
    import DashboardStatCard from "./DashboardStatCard.svelte";

    export let loading: boolean;
    export let user_has_org_admin_access: boolean;
    export let stats: {
        organizations: number;
        competitions: number;
        teams: number;
        players: number;
    };

    const DASHBOARD_STAT_CARD_DATA = [
        {
            title: "Organizations",
            href: "/organizations",
            background_class: "bg-sky-100 dark:bg-sky-900/60",
            icon_class: "text-sky-500",
            hover_ring_class: "hover:ring-sky-400 dark:hover:ring-sky-500",
            path_d: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
            value_key: "organizations",
        },
        {
            title: "Competitions",
            href: "/competitions",
            background_class: "bg-teal-100 dark:bg-teal-900/60",
            icon_class: "text-teal-500",
            hover_ring_class: "hover:ring-teal-400 dark:hover:ring-teal-500",
            path_d: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
            value_key: "competitions",
        },
        {
            title: "Teams",
            href: "/teams",
            background_class: "bg-fuchsia-100 dark:bg-fuchsia-900/60",
            icon_class: "text-fuchsia-500",
            hover_ring_class:
                "hover:ring-fuchsia-400 dark:hover:ring-fuchsia-500",
            path_d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
            value_key: "teams",
        },
        {
            title: "Players",
            href: "/players",
            background_class: "bg-sky-100 dark:bg-sky-900/60",
            icon_class: "text-sky-500",
            hover_ring_class: "hover:ring-sky-400 dark:hover:ring-sky-500",
            path_d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
            value_key: "players",
        },
    ] as const;
</script>

<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {#each DASHBOARD_STAT_CARD_DATA as current_card}
        <DashboardStatCard
            title={current_card.title}
            value={stats[current_card.value_key]}
            {loading}
            href={current_card.href}
            user_can_navigate={user_has_org_admin_access}
            background_class={current_card.background_class}
            icon_class={current_card.icon_class}
            hover_ring_class={current_card.hover_ring_class}
            path_d={current_card.path_d}
        />
    {/each}
</div>
