<script lang="ts">
    import { get_competition_status_badge_tone_classes } from "./competitionTabConstants";

    export let competition_name: string;
    export let derived_status: string;
    export let status_label: string;
    export let on_cancel: () => void;
</script>

<div class="flex flex-col w-full gap-0">
    <div class="flex items-center gap-4 w-full mb-0">
        <button
            type="button"
            class="btn btn-outline"
            on:click={on_cancel}
            aria-label="Go back"
        >
            ← Back
        </button>
        <h1
            class="text-2xl sm:text-2xl font-bold text-accent-900 dark:text-accent-100"
        >
            {competition_name}
        </h1>
        <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-[0.175rem] text-xs font-medium {get_competition_status_badge_tone_classes(
                derived_status,
            )}">{status_label}</span
        >
    </div>
</div>
