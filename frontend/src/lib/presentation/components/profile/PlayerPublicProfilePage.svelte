<script lang="ts">
    import type { Player } from "$lib/core/entities/Player";
    import {
        get_player_avatar,
        get_player_full_name,
        get_player_initials,
    } from "$lib/core/entities/Player";
    import type { PlayerProfile } from "$lib/core/entities/PlayerProfile";
    import type { PlayerPublicPositionState } from "$lib/presentation/logic/playerPublicProfileDataLoaderContracts";
    import type {
        PlayerPublicProfileLinkSections,
        PlayerPublicProfileStats,
        PlayerPublicTeamStats,
    } from "$lib/presentation/logic/playerPublicProfilePageState";

    import PlayerPublicProfileLinks from "./PlayerPublicProfileLinks.svelte";
    import PlayerTeamStatsSection from "./PlayerTeamStatsSection.svelte";
    import PublicProfileHero from "./PublicProfileHero.svelte";

    interface PublicProfileMetadataItem {
        label: string;
        value: string;
    }

    export let profile: PlayerProfile;
    export let player: Player;
    export let position_state: PlayerPublicPositionState;
    export let overall_stats: PlayerPublicProfileStats;
    export let team_stats: PlayerPublicTeamStats[];
    export let link_sections: PlayerPublicProfileLinkSections;

    function build_player_metadata_items(
        current_player: Player,
    ): PublicProfileMetadataItem[] {
        const metadata_items: PublicProfileMetadataItem[] = [];
        if (current_player.nationality) {
            metadata_items.push({
                label: "Nationality",
                value: current_player.nationality,
            });
        }
        if (current_player.height_cm) {
            metadata_items.push({
                label: "Height",
                value: `${current_player.height_cm} cm`,
            });
        }
        if (current_player.weight_kg) {
            metadata_items.push({
                label: "Weight",
                value: `${current_player.weight_kg} kg`,
            });
        }
        metadata_items.push({ label: "Status", value: current_player.status });
        return metadata_items;
    }

    $: metadata_items = build_player_metadata_items(player);
</script>

<PublicProfileHero
    image_url={player.profile_image_url ? get_player_avatar(player) : ""}
    image_alt={get_player_full_name(player)}
    fallback_text={get_player_initials(player)}
    title={get_player_full_name(player)}
    subtitle={
        position_state.status === "present"
            ? position_state.position.name
            : ""
    }
    summary={profile.profile_summary || ""}
    {metadata_items}
/>

<section
    class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-8 p-6"
>
    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
        Career Statistics
    </h2>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div
            class="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-4 text-center"
        >
            <p
                class="text-3xl sm:text-4xl font-bold text-indigo-600 dark:text-indigo-400"
            >
                {overall_stats.total_matches}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Matches</p>
        </div>
        <div
            class="bg-green-50 dark:bg-green-900/30 rounded-xl p-4 text-center"
        >
            <p
                class="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400"
            >
                {overall_stats.goals}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Goals</p>
        </div>
        <div class="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 text-center">
            <p
                class="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400"
            >
                {overall_stats.assists}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Assists</p>
        </div>
        <div
            class="bg-violet-50 dark:bg-violet-900/30 rounded-xl p-4 text-center"
        >
            <p
                class="text-3xl sm:text-4xl font-bold text-violet-600 dark:text-violet-400"
            >
                {overall_stats.yellow_cards}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Yellow Cards
            </p>
        </div>
    </div>

    <div class="grid grid-cols-3 gap-4">
        <div
            class="text-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
        >
            <p class="text-xl font-bold text-red-600 dark:text-red-400">
                {overall_stats.red_cards}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Red Cards</p>
        </div>
        <div
            class="text-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
        >
            <p class="text-xl font-bold text-gray-700 dark:text-gray-300">
                {overall_stats.own_goals}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Own Goals</p>
        </div>
        <div
            class="text-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
        >
            <p class="text-xl font-bold text-purple-600 dark:text-purple-400">
                {overall_stats.substitutions_in}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
                Sub Appearances
            </p>
        </div>
    </div>
</section>

<PlayerTeamStatsSection {team_stats} />

<PlayerPublicProfileLinks
    social_media_links={link_sections.social_media_links}
    website_links={link_sections.website_links}
    video_links={link_sections.video_links}
/>

<footer class="text-center mt-8 py-4 text-sm text-gray-500 dark:text-gray-400">
    <p>Powered by Sport-Sync</p>
</footer>
