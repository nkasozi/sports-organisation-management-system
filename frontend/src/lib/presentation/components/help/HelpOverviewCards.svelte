<script lang="ts">
    import { HELP_OVERVIEW_CARDS } from "../../logic/helpPageContent";
</script>

<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    {#each HELP_OVERVIEW_CARDS as current_card}
        <a
            href={current_card.href}
            class="card p-6 hover:shadow-md transition-shadow"
        >
            <div
                class={`w-12 h-12 ${current_card.icon_background_class} rounded-lg flex items-center justify-center mb-4`}
            >
                <svg
                    class={`h-6 w-6 ${current_card.icon_class}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    {#each current_card.icon_paths as current_path}
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d={current_path}
                        />
                    {/each}
                </svg>
            </div>
            <h3 class="font-semibold text-accent-900 dark:text-accent-100">
                {current_card.title}
            </h3>
            <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
                {current_card.description}
            </p>
        </a>
    {/each}
</div>
