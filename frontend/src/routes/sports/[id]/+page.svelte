<script lang="ts">
    import { onMount } from "svelte";

    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { sportService } from "$lib/adapters/persistence/sportService";
    import {
        create_empty_sport_input,
        type CreateSportInput,
    } from "$lib/core/entities/Sport";
    import SportFormEditor from "$lib/presentation/components/sport/SportFormEditor.svelte";
    import type { LoadingState } from "$lib/presentation/components/ui/LoadingStateWrapper.svelte";
    import LoadingStateWrapper from "$lib/presentation/components/ui/LoadingStateWrapper.svelte";
    import Toast from "$lib/presentation/components/ui/Toast.svelte";
    import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
    import { create_sport_form_data_from_sport } from "$lib/presentation/logic/sportFormEditorState";

    let form_data: CreateSportInput = create_empty_sport_input();
    let loading_state: LoadingState = "idle";
    let error_message: string = "";
    let is_saving: boolean = false;
    let errors: Record<string, string> = {};
    let toast_visible: boolean = false;
    let toast_message: string = "";
    let toast_type: "success" | "error" | "info" = "info";

    $: sport_id = $page.params.id ?? "";

    async function initialize_page(): Promise<void> {
        if (!browser) return;
        const auth_result = await ensure_auth_profile();
        if (!auth_result.success) {
            loading_state = "error";
            error_message = auth_result.error_message;
            return;
        }
        if (!sport_id) {
            loading_state = "error";
            error_message = "Sport ID is required";
            return;
        }
        await load_sport();
    }

    async function load_sport(): Promise<void> {
        loading_state = "loading";
        const result = await sportService.get_by_id(sport_id);
        if (!result.success) {
            loading_state = "error";
            error_message = result.error || "Failed to load sport";
            return;
        }
        if (!result.data) {
            loading_state = "error";
            error_message = "Sport not found";
            return;
        }
        form_data = create_sport_form_data_from_sport(result.data);
        loading_state = "success";
    }

    async function handle_submit(): Promise<void> {
        errors = {};
        is_saving = true;
        const result = await sportService.update(sport_id, form_data);
        if (!result.success) {
            is_saving = false;
            show_toast(result.error || "Failed to update sport", "error");
            return;
        }
        is_saving = false;
        show_toast("Sport updated successfully!", "success");
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
    <title>Edit Sport - Sports Management</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
    <LoadingStateWrapper
        state={loading_state}
        {error_message}
        loading_text="Loading sport..."
    >
        <SportFormEditor
            title="Edit Sport"
            bind:form_data
            {errors}
            {is_saving}
            submit_label="Save Changes"
            saving_label="Saving..."
            show_presets={false}
            on_cancel={handle_cancel}
            on_submit={handle_submit}
        />
    </LoadingStateWrapper>
</div>

<Toast
    message={toast_message}
    type={toast_type}
    is_visible={toast_visible}
    on:dismiss={() => (toast_visible = false)}
/>
