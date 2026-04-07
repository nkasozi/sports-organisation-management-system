<script lang="ts">
    import { onMount } from "svelte";

    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import { sportService } from "$lib/adapters/persistence/sportService";
    import {
        create_empty_sport_input,
        type CreateSportInput,
    } from "$lib/core/entities/Sport";
    import SportFormEditor from "$lib/presentation/components/sport/SportFormEditor.svelte";
    import Toast from "$lib/presentation/components/ui/Toast.svelte";
    import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
    import {
        apply_sport_preset,
        type SportPresetType,
    } from "$lib/presentation/logic/sportFormEditorState";

    let form_data: CreateSportInput = create_empty_sport_input();
    let is_loading: boolean = true;
    let is_saving: boolean = false;
    let error_message: string = "";
    let errors: Record<string, string> = {};
    let toast_visible: boolean = false;
    let toast_message: string = "";
    let toast_type: "success" | "error" | "info" = "info";

    async function initialize_page(): Promise<void> {
        if (!browser) return;
        const auth_result = await ensure_auth_profile();
        if (!auth_result.success) {
            error_message = auth_result.error_message;
            is_loading = false;
            return;
        }
        is_loading = false;
    }

    function handle_apply_preset(preset_type: SportPresetType): void {
        form_data = apply_sport_preset(preset_type);
        show_toast(
            `Applied ${preset_type.replace("_", " ")} preset`,
            "success",
        );
    }

    async function handle_submit(): Promise<void> {
        errors = {};
        is_saving = true;
        const result = await sportService.create(form_data);
        if (!result.success) {
            is_saving = false;
            show_toast(result.error || "Failed to create sport", "error");
            return;
        }
        is_saving = false;
        show_toast("Sport created successfully!", "success");
        setTimeout(() => goto("/sports"), 1500);
    }

    function handle_cancel(): void {
        goto("/sports");
    }
    function show_toast(
        message: string,
        type: "success" | "error" | "info",
    ): void {
        toast_message = message;
        toast_type = type;
        toast_visible = true;
    }

    onMount(() => {
        void initialize_page();
    });
</script>

<svelte:head>
    <title>Create Sport - Sports Management</title>
</svelte:head>

{#if is_loading}
    <div class="flex justify-center items-center py-12">
        <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"
        ></div>
    </div>
{:else if error_message}
    <div
        class="bg-white dark:bg-accent-800 shadow-sm border-y border-accent-200 dark:border-accent-700 -mx-4 px-4 py-8 text-center sm:mx-0 sm:p-8 sm:border sm:rounded-lg"
    >
        <svg
            class="mx-auto h-12 w-12 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            /></svg
        >
        <h3
            class="mt-4 text-lg font-medium text-accent-900 dark:text-accent-100"
        >
            Unable to Create Sport
        </h3>
        <p class="mt-2 text-accent-600 dark:text-accent-400">{error_message}</p>
    </div>
{:else}
    <div class="max-w-4xl mx-auto space-y-6">
        <SportFormEditor
            title="Create Sport"
            bind:form_data
            {errors}
            {is_saving}
            submit_label="Create Sport"
            saving_label="Creating..."
            show_presets={true}
            on_cancel={handle_cancel}
            on_submit={handle_submit}
            on_apply_preset={handle_apply_preset}
        />
    </div>
{/if}

<Toast
    message={toast_message}
    type={toast_type}
    is_visible={toast_visible}
    on:dismiss={() => (toast_visible = false)}
/>
