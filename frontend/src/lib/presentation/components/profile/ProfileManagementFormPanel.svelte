<script lang="ts">
    import { browser } from "$app/environment";
    import type { BaseEntity } from "$lib/core/entities/BaseEntity";
    import type { EntityViewCallbacks } from "$lib/core/types/EntityHandlers";
    import DynamicEntityForm from "$lib/presentation/components/DynamicEntityForm.svelte";

    export let title: string;
    export let entity_type: string;
    export let entity_data: Partial<BaseEntity> | undefined;
    export let back_button_label: string;
    export let preview_panel_label: string;
    export let preview_panel_action_label: string;
    export let preview_path: string;
    export let show_preview_panel: boolean;
    export let on_back_requested: () => void;
    export let view_callbacks: EntityViewCallbacks;

    function open_preview_path(): void {
        if (!browser || !preview_path) {
            return;
        }

        window.open(preview_path, "_blank");
    }
</script>

<div class="space-y-4">
    <button type="button" class="btn btn-outline" on:click={on_back_requested}>
        {back_button_label}
    </button>

    <div class="card p-6">
        <h2 class="text-xl font-bold text-accent-900 dark:text-accent-100 mb-6">
            {title}
        </h2>

        {#if show_preview_panel && preview_path}
            <div
                class="mb-6 p-4 bg-accent-50 dark:bg-accent-700/50 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
                <div>
                    <p class="text-sm text-accent-600 dark:text-accent-400">
                        {preview_panel_label}
                    </p>
                    <code
                        class="text-sm font-medium text-primary-600 dark:text-primary-400"
                    >
                        {preview_path}
                    </code>
                </div>
                <button
                    type="button"
                    class="btn btn-outline btn-sm"
                    on:click={open_preview_path}
                >
                    {preview_panel_action_label}
                </button>
            </div>
        {/if}

        <DynamicEntityForm
            {entity_type}
            {entity_data}
            is_mobile_view={false}
            crud_handlers={void 0}
            sub_entity_filter={void 0}
            {view_callbacks}
        />
    </div>
</div>
