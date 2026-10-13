<script lang="ts">
    import { onMount } from "svelte";

    import { get_official_full_name } from "$lib/core/entities/Official";
    import type { RatingDimensions } from "$lib/core/entities/OfficialPerformanceRating";
    import { validate_rating_input } from "$lib/core/entities/OfficialPerformanceRating";
    import {
        get_official_performance_rating_use_cases,
        get_official_use_cases,
    } from "$lib/infrastructure/registry/useCaseFactories";
    import StarRatingInput from "$lib/presentation/components/ui/StarRatingInput.svelte";
    import Toast from "$lib/presentation/components/ui/Toast.svelte";
    import { resolve_official_rating_submit_feedback } from "$lib/presentation/logic/officialRatingPanelFeedback";
    import {
        load_official_rating_panel,
        OFFICIAL_RATING_DIMENSIONS,
        type OfficialRatingState,
    } from "$lib/presentation/logic/officialRatingPanelState";
    import type { ToastType } from "$lib/presentation/logic/toastConfig";

    import {
        build_official_rating_submit_input,
        OFFICIAL_RATING_PANEL_STATUS,
        type OfficialRatingPanelViewState,
    } from "./official/officialRatingPanelViewState";
    import { TOAST_TYPE } from "./ui/toastTypes";

    function get_rating_dim(
        rating: RatingDimensions & { notes: string },
        key: string,
    ): number {
        return (rating as unknown as { [k: string]: number })[key] ?? 0;
    }

    function set_rating_dim(
        state: OfficialRatingState,
        key: string,
        new_value: number,
    ): void {
        (state.rating as unknown as { [k: string]: number })[key] = new_value;
        official_states = official_states;
    }

    export let fixture_id: string;
    export let organization_id: string;
    export let rater_user_id: string;
    export let rater_role: string;
    export let assigned_official_ids: string[];

    const rating_use_cases = get_official_performance_rating_use_cases();
    const official_use_cases = get_official_use_cases();

    let official_states: OfficialRatingState[] = [];
    let panel_state: OfficialRatingPanelViewState = {
        status: OFFICIAL_RATING_PANEL_STATUS.LOADING,
    };
    let toast_message = "";
    let toast_type: ToastType = TOAST_TYPE.SUCCESS;
    let toast_visible = false;

    async function load_officials_and_existing_ratings(): Promise<void> {
        panel_state = { status: OFFICIAL_RATING_PANEL_STATUS.LOADING };
        const panel_result = await load_official_rating_panel(
            {
                fixture_id,
                organization_id,
                assigned_official_ids,
                rater_user_id,
            },
            { official_use_cases, rating_use_cases },
        );
        if (!panel_result.success) {
            panel_state = {
                status: OFFICIAL_RATING_PANEL_STATUS.FAILED,
                message: panel_result.error,
            };
            return;
        }
        official_states = panel_result.data;
        panel_state = { status: OFFICIAL_RATING_PANEL_STATUS.READY };
    }

    async function submit_rating(state: OfficialRatingState): Promise<void> {
        const input = build_official_rating_submit_input(state, {
            organization_id,
            fixture_id,
            rater_user_id,
            rater_role,
        });

        const errors = validate_rating_input(input);
        state.validation_errors = errors;
        official_states = official_states;

        if (errors.length > 0) return;

        state.is_saving = true;
        official_states = official_states;

        const result = await rating_use_cases.submit_or_update_rating(input);

        state.is_saving = false;
        if (result.success) state.existing_id = result.data.id;
        const feedback = resolve_official_rating_submit_feedback(result, {
            fixture_id,
            official_id: state.official.id,
            official_name: get_official_full_name(state.official),
        });
        toast_message = feedback.toast_message;
        toast_type = feedback.toast_type;
        toast_visible = true;
        official_states = official_states;
    }

    onMount(load_officials_and_existing_ratings);
</script>

<Toast
    message={toast_message}
    type={toast_type}
    bind:is_visible={toast_visible}
/>

{#if panel_state.status === OFFICIAL_RATING_PANEL_STATUS.LOADING}
    <p class="text-center text-sm text-gray-500 py-4">Loading officials...</p>
{:else if panel_state.status === OFFICIAL_RATING_PANEL_STATUS.FAILED}
    <p class="text-center text-sm text-red-600 py-4" role="alert">
        {panel_state.message}
    </p>
{:else if official_states.length === 0}
    <p class="text-center text-sm text-gray-400 py-4">
        No officials assigned to this fixture.
    </p>
{:else}
    <div class="space-y-6">
        {#each official_states as state (state.official.id)}
            <div class="border border-gray-200 rounded-lg p-4 bg-white">
                <h4 class="font-semibold text-gray-800 mb-3">
                    {get_official_full_name(state.official)}
                    {#if state.existing_id}
                        <span class="ml-2 text-xs text-emerald-600 font-normal"
                            >Rated ✓</span
                        >
                    {/if}
                </h4>

                {#each OFFICIAL_RATING_DIMENSIONS as dim}
                    <div
                        class="flex flex-col gap-1 mb-3 sm:flex-row sm:items-center"
                    >
                        <span class="w-40 text-sm text-gray-600 shrink-0"
                            >{dim.label}</span
                        >
                        <StarRatingInput
                            field_id="dim-{state.official.id}-{dim.key}"
                            value={get_rating_dim(state.rating, dim.key)}
                            max={10}
                            on:change={(e) =>
                                set_rating_dim(state, dim.key, e.detail)}
                        />
                    </div>
                {/each}

                <div class="mt-3">
                    <label
                        for="notes-{state.official.id}"
                        class="text-sm text-gray-600">Notes (optional)</label
                    >
                    <textarea
                        id="notes-{state.official.id}"
                        bind:value={state.rating.notes}
                        rows="2"
                        class="mt-1 w-full border border-gray-200 rounded px-2 py-1 text-sm"
                        placeholder="Add any observations..."
                    ></textarea>
                </div>

                {#if state.validation_errors.length > 0}
                    <ul class="mt-2 text-xs text-red-500 list-disc list-inside">
                        {#each state.validation_errors as err}
                            <li>{err}</li>
                        {/each}
                    </ul>
                {/if}

                <button
                    on:click={() => submit_rating(state)}
                    disabled={state.is_saving}
                    class="mt-3 w-full py-2 rounded bg-emerald-600 text-white text-sm font-medium disabled:opacity-50"
                >
                    {state.is_saving
                        ? "Saving..."
                        : state.existing_id
                          ? "Update Rating"
                          : "Submit Rating"}
                </button>
            </div>
        {/each}
    </div>
{/if}
