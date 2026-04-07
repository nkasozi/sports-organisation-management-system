<script lang="ts">
    export let visible: boolean;

    const DASHBOARD_QUICK_ACTIONS = [
        {
            href: "/organizations",
            label: "Organizations",
            background_class: "bg-sky-600",
        },
        {
            href: "/competitions/create",
            label: "New Competition",
            background_class: "bg-teal-700",
        },
        { href: "/teams", label: "Teams", background_class: "bg-fuchsia-700" },
        {
            href: "/fixtures/create",
            label: "Create Fixture",
            background_class: "bg-sky-600",
        },
    ] as const;
</script>

{#if visible}
    <div class="card p-6">
        <h2
            class="text-lg font-semibold text-accent-900 dark:text-accent-100 mb-4"
        >
            Quick Actions
        </h2>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {#each DASHBOARD_QUICK_ACTIONS as current_action}
                <a
                    href={current_action.href}
                    class="flex flex-col items-center p-4 text-center hover:bg-accent-50 dark:hover:bg-accent-700 rounded-lg transition-colors duration-200 mobile-touch"
                >
                    <div
                        class="h-12 w-12 {current_action.background_class} rounded-lg flex items-center justify-center mb-3"
                    >
                        <svg
                            class="h-6 w-6 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                        </svg>
                    </div>
                    <span
                        class="text-sm font-medium text-accent-900 dark:text-accent-100"
                        >{current_action.label}</span
                    >
                </a>
            {/each}
        </div>
    </div>
{/if}
