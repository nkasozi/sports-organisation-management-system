<script lang="ts">
    import { browser } from "$app/environment";
    import { get_team_profile_use_cases } from "$lib/infrastructure/registry/useCaseFactories";
    import type { ToastType } from "$lib/presentation/logic/toastConfig";

    import {
        copy_team_profile_link,
        load_team_profile_preview,
        TEAM_PROFILE_PREVIEW_MESSAGES,
        TEAM_PROFILE_PREVIEW_STATUS,
        TEAM_PROFILE_PREVIEW_WINDOW_TARGET,
        type TeamProfilePreviewState,
    } from "./teamProfilePreview/teamProfilePreviewState";
    import Toast from "./ui/Toast.svelte";
    import { TOAST_TYPE } from "./ui/toastTypes";

    export let team_id: string;

    let preview_state: TeamProfilePreviewState = {
        status: TEAM_PROFILE_PREVIEW_STATUS.IDLE,
    };
    let toast_message = "";
    let toast_type: ToastType = TOAST_TYPE.INFO;
    let is_toast_visible = false;

    const profile_use_cases = get_team_profile_use_cases();

    $: if (team_id && browser) void refresh_preview(team_id);

    async function refresh_preview(requested_team_id: string): Promise<void> {
        preview_state = { status: TEAM_PROFILE_PREVIEW_STATUS.LOADING };
        preview_state = await load_team_profile_preview({
            team_id: requested_team_id,
            origin: window.location.origin,
            list_team_profiles: (filter) => profile_use_cases.list(filter),
        });
    }

    function open_preview(preview_url: string): void {
        window.open(preview_url, TEAM_PROFILE_PREVIEW_WINDOW_TARGET);
    }

    async function copy_link(preview_url: string): Promise<void> {
        const copy_result = await copy_team_profile_link(
            preview_url,
            (text: string) => navigator.clipboard.writeText(text),
        );
        toast_type = copy_result.success
            ? TOAST_TYPE.SUCCESS
            : TOAST_TYPE.ERROR;
        toast_message = copy_result.success
            ? copy_result.data
            : copy_result.error;
        is_toast_visible = true;
    }
</script>

{#if preview_state.status === TEAM_PROFILE_PREVIEW_STATUS.LOADED}
    {@const preview_url = preview_state.preview_url}
    <div
        class="flex flex-col sm:flex-row gap-3 p-4 bg-primary-50 dark:bg-primary-900 rounded-lg border border-primary-200 dark:border-primary-700"
    >
        <div class="flex-1">
            <div
                class="text-sm font-medium text-primary-900 dark:text-primary-100"
            >
                Public Profile URL
            </div>
            <div
                class="text-sm text-primary-600 dark:text-primary-400 mt-1 break-all"
            >
                {preview_url}
            </div>
            <div class="text-xs text-primary-500 dark:text-primary-400 mt-1">
                Visibility: <span class="font-medium"
                    >{preview_state.is_public
                        ? TEAM_PROFILE_PREVIEW_MESSAGES.VISIBILITY_PUBLIC
                        : TEAM_PROFILE_PREVIEW_MESSAGES.VISIBILITY_PRIVATE}</span
                >
            </div>
        </div>

        <div class="flex gap-2">
            <button
                on:click={() => open_preview(preview_url)}
                class="px-4 py-2 rounded-[0.175rem] bg-primary-600 dark:bg-primary-500 text-white hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors text-sm font-medium"
            >
                Preview
            </button>
            <button
                on:click={() => void copy_link(preview_url)}
                class="px-4 py-2 rounded-[0.175rem] bg-accent-200 dark:bg-accent-700 text-accent-900 dark:text-accent-100 hover:bg-accent-300 dark:hover:bg-accent-600 transition-colors text-sm font-medium"
            >
                Copy Link
            </button>
        </div>
    </div>
{:else if preview_state.status === TEAM_PROFILE_PREVIEW_STATUS.LOADING}
    <div class="p-4 text-center text-accent-600 dark:text-accent-400">
        Loading profile...
    </div>
{:else if preview_state.status === TEAM_PROFILE_PREVIEW_STATUS.FAILED}
    <div
        class="p-4 text-center text-secondary-700 dark:text-secondary-300 bg-secondary-50 dark:bg-secondary-900/20 rounded-lg border border-secondary-200 dark:border-secondary-800"
        role="alert"
    >
        <p class="text-sm">{preview_state.message}</p>
    </div>
{:else if preview_state.status === TEAM_PROFILE_PREVIEW_STATUS.NOT_FOUND}
    <div
        class="p-4 text-center text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-800 rounded-lg border border-accent-200 dark:border-accent-700"
    >
        <p class="text-sm">
            No public profile found. Create a team profile to get a shareable
            link.
        </p>
    </div>
{/if}

<Toast
    message={toast_message}
    type={toast_type}
    bind:is_visible={is_toast_visible}
/>
