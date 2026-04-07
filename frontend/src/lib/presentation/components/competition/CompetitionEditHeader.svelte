<script lang="ts">
    export let competition_name: string;
    export let derived_status: string;
    export let status_label: string;
    export let on_cancel: () => void;

    function get_status_badge_classes(status: string): string {
        const base_classes =
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
        switch (status) {
            case "active":
                return `${base_classes} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`;
            case "upcoming":
                return `${base_classes} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400`;
            case "completed":
                return `${base_classes} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
            case "cancelled":
                return `${base_classes} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`;
            default:
                return base_classes;
        }
    }
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
        <span class={get_status_badge_classes(derived_status)}
            >{status_label}</span
        >
    </div>
</div>
