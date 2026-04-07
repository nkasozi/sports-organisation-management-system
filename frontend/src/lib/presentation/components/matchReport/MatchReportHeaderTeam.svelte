<script lang="ts">
    import TeamLogoThumbnail from "$lib/presentation/components/ui/TeamLogoThumbnail.svelte";

    interface $$Props {
        team_name: string;
        team_logo_url: string;
        score: number;
        is_game_scheduled: boolean;
    }

    export let team_name: string;
    export let team_logo_url: string;
    export let score: number;
    export let is_game_scheduled: boolean;
</script>

<div class="text-center flex-1">
    <div class="flex justify-center mb-2">
        <TeamLogoThumbnail logo_url={team_logo_url} {team_name} size="lg" />
    </div>
    <div class="text-sm sm:text-base font-medium text-gray-300 mb-2 truncate">
        {team_name}
    </div>
    <div class="text-4xl sm:text-5xl font-bold tabular-nums">
        {#if is_game_scheduled}
            <span class="text-gray-500 text-3xl">-</span>
        {:else}
            {score}
        {/if}
    </div>
</div>
