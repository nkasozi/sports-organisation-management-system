<script lang="ts">
    import type { ProfileLink } from "$lib/core/entities/ProfileLink";
    import type { Team } from "$lib/core/entities/Team";
    import { get_team_initials, get_team_logo } from "$lib/core/entities/Team";
    import type { TeamProfile } from "$lib/core/entities/TeamProfile";
    import type {
        CompetitionPublicProfileStats,
        TeamPublicProfileStats,
    } from "$lib/presentation/logic/teamPublicProfilePageState";

    import ProfileLinkChipList from "./ProfileLinkChipList.svelte";
    import PublicProfileHero from "./PublicProfileHero.svelte";
    import TeamCompetitionSections from "./TeamCompetitionSections.svelte";

    export let profile: TeamProfile;
    export let team: Team;
    export let overall_stats: TeamPublicProfileStats;
    export let competition_stats: CompetitionPublicProfileStats[];
    export let profile_links: ProfileLink[];
    export let teams_by_id: Map<string, Team>;
</script>

<PublicProfileHero
    image_url={team.logo_url ? get_team_logo(team) : ""}
    image_alt={team.name}
    fallback_text={get_team_initials(team)}
    title={team.name}
    title_suffix={team.founded_year ? `Est. ${team.founded_year}` : null}
    subtitle={team.short_name || null}
    summary={profile.profile_summary || null}
>
    <svelte:fragment slot="supplementary">
        {#if profile_links.length > 0}
            <ProfileLinkChipList links={profile_links} />
        {/if}
    </svelte:fragment>
</PublicProfileHero>

{#if overall_stats.total_matches > 0}
    <section
        class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-8 p-6"
    >
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Overall Statistics
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
                class="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-4 text-center"
            >
                <div
                    class="text-3xl sm:text-4xl font-bold text-indigo-600 dark:text-indigo-400"
                >
                    {overall_stats.total_matches}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Matches
                </div>
            </div>
            <div
                class="bg-green-50 dark:bg-green-900/30 rounded-xl p-4 text-center"
            >
                <div
                    class="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400"
                >
                    {overall_stats.wins}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Wins
                </div>
            </div>
            <div
                class="bg-violet-50 dark:bg-violet-900/30 rounded-xl p-4 text-center"
            >
                <div
                    class="text-3xl sm:text-4xl font-bold text-violet-600 dark:text-violet-400"
                >
                    {overall_stats.draws}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Draws
                </div>
            </div>
            <div
                class="bg-red-50 dark:bg-red-900/30 rounded-xl p-4 text-center"
            >
                <div
                    class="text-3xl sm:text-4xl font-bold text-red-600 dark:text-red-400"
                >
                    {overall_stats.losses}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Losses
                </div>
            </div>
            <div
                class="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 text-center"
            >
                <div
                    class="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400"
                >
                    {overall_stats.goals_for}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Goals For
                </div>
            </div>
            <div
                class="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-4 text-center"
            >
                <div
                    class="text-3xl sm:text-4xl font-bold text-purple-600 dark:text-purple-400"
                >
                    {overall_stats.goals_against}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Goals Against
                </div>
            </div>
            <div
                class="bg-violet-50 dark:bg-violet-900/30 rounded-xl p-4 text-center"
            >
                <div
                    class="text-3xl sm:text-4xl font-bold text-violet-600 dark:text-violet-400"
                >
                    {overall_stats.yellow_cards}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Yellow Cards
                </div>
            </div>
            <div
                class="bg-red-50 dark:bg-red-900/30 rounded-xl p-4 text-center"
            >
                <div
                    class="text-3xl sm:text-4xl font-bold text-red-600 dark:text-red-400"
                >
                    {overall_stats.red_cards}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Red Cards
                </div>
            </div>
        </div>
    </section>
{/if}

<TeamCompetitionSections {competition_stats} teams_map={teams_by_id} />

{#if overall_stats.total_matches === 0}
    <section
        class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden p-12 text-center"
    >
        <div class="text-6xl mb-4">📊</div>
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Statistics Yet
        </h3>
        <p class="text-gray-600 dark:text-gray-400">
            Statistics will appear here once the team starts playing matches.
        </p>
    </section>
{/if}
