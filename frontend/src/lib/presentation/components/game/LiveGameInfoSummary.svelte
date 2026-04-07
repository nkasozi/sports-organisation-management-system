<script lang="ts">
    export let venue_name: string;
    export let venue_location: string;
    export let home_team_short_name: string;
    export let away_team_short_name: string;
    export let home_team_color: string;
    export let away_team_color: string;
    export let officials_color: string;
    export let assigned_officials: Array<{ name: string; role_name: string }>;
</script>

<div
    class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6"
>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="text-center md:text-left">
            <div
                class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1"
            >
                📍 Venue
            </div>
            <div class="text-sm font-medium text-gray-900 dark:text-white">
                {venue_name || "TBD"}
            </div>
            {#if venue_location}<div
                    class="text-xs text-gray-500 dark:text-gray-400"
                >
                    {venue_location}
                </div>{/if}
        </div>
        <div class="text-center">
            <div
                class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2"
            >
                👕 Team Colors
            </div>
            <div class="flex items-center justify-center gap-4">
                <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-600 dark:text-gray-300"
                        >{home_team_short_name}</span
                    >
                    <div
                        class="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600"
                        style={`background-color: ${home_team_color};`}
                    ></div>
                </div>
                <span class="text-gray-400">vs</span>
                <div class="flex items-center gap-2">
                    <div
                        class="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600"
                        style={`background-color: ${away_team_color};`}
                    ></div>
                    <span class="text-xs text-gray-600 dark:text-gray-300"
                        >{away_team_short_name}</span
                    >
                </div>
            </div>
            {#if officials_color}<div
                    class="mt-2 flex items-center justify-center gap-2"
                >
                    <span class="text-xs text-gray-500 dark:text-gray-400"
                        >Officials:</span
                    >
                    <div
                        class="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
                        style={`background-color: ${officials_color};`}
                    ></div>
                </div>{/if}
        </div>
        <div class="text-center md:text-right">
            <div
                class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1"
            >
                🏅 Match Officials
            </div>
            {#if assigned_officials.length > 0}<div class="space-y-1">
                    {#each assigned_officials as assignment}<div
                            class="text-sm"
                        >
                            <span class="text-gray-600 dark:text-gray-400"
                                >{assignment.role_name}:</span
                            ><span
                                class="font-medium text-gray-900 dark:text-white"
                            >
                                {assignment.name}</span
                            >
                        </div>{/each}
                </div>{:else}<div
                    class="text-sm text-gray-500 dark:text-gray-400"
                >
                    Not assigned
                </div>{/if}
        </div>
    </div>
</div>
