<script lang="ts">
    import type { Team } from "$lib/core/entities/Team";

    export let team: Team;
    export let action_label: string;
    export let action_icon: "add" | "remove";
    export let action_button_classes: string;
    export let container_classes: string;
    export let disabled: boolean = false;
    export let on_action: (team: Team) => Promise<void> | void;
</script>

<div class={container_classes}>
    <div class="flex items-center gap-3">
        <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={`background-color: ${team.primary_color}`}
        >
            {team.name.charAt(0)}
        </div>
        <span class="font-medium text-accent-900 dark:text-accent-100"
            >{team.name}</span
        >
    </div>
    <button
        type="button"
        class={action_button_classes}
        {disabled}
        on:click={() => void on_action(team)}
        aria-label={`${action_label} ${team.name}`}
    >
        <svg
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            {#if action_icon === "add"}
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v16m8-8H4"
                />
            {:else}
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                />
            {/if}
        </svg>
    </button>
</div>
