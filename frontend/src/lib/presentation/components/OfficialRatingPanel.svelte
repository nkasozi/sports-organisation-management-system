<script lang="ts">
    import { onMount } from "svelte";
    import type {
        OfficialPerformanceRating,
        CreateOfficialPerformanceRatingInput,
        RatingDimensions,
    } from "$lib/core/entities/OfficialPerformanceRating";
    import { validate_rating_input } from "$lib/core/entities/OfficialPerformanceRating";
    import { get_official_performance_rating_use_cases } from "$lib/core/usecases/OfficialPerformanceRatingUseCases";
    import { get_official_use_cases } from "$lib/core/usecases/OfficialUseCases";
    import type { Official } from "$lib/core/entities/Official";
    import { get_official_full_name } from "$lib/core/entities/Official";
    import Toast from "$lib/presentation/components/ui/Toast.svelte";

    export let fixture_id: string;
    export let organization_id: string;
    export let rater_user_id: string;
    export let rater_role: string;
    export let assigned_official_ids: string[];

    const rating_use_cases = get_official_performance_rating_use_cases();
    const official_use_cases = get_official_use_cases();

    type OfficialRatingState = {
        official: Official;
        rating: RatingDimensions & { notes: string };
        existing_id: string | null;
        is_saving: boolean;
        validation_errors: string[];
    };

    let official_states: OfficialRatingState[] = [];
    let is_loading = true;
    let toast_message = "";
    let toast_type: "success" | "error" = "success";
    let toast_visible = false;

    function build_default_dimensions(): RatingDimensions & { notes: string } {
        return {
            overall: 5,
            decision_accuracy: 5,
            game_control: 5,
            communication: 5,
            fitness: 5,
            notes: "",
        };
    }

    async function load_officials_and_existing_ratings(): Promise<void> {
        is_loading = true;
        const officials_result = await official_use_cases.list({
            organization_id,
        });
        if (!officials_result.success || !officials_result.data) {
            toast_message = !officials_result.success
                ? officials_result.error
                : "Failed to load officials";
            toast_type = "error";
            toast_visible = true;
            is_loading = false;
            return;
        }

        const officials_map = new Map(
            officials_result.data.items.map((o: Official) => [o.id, o]),
        );

        const ratings_result =
            await rating_use_cases.list_by_fixture(fixture_id);
        const existing_ratings: OfficialPerformanceRating[] =
            ratings_result.success && ratings_result.data
                ? ratings_result.data.items
                : [];

        const rater_ratings = existing_ratings.filter(
            (r) => r.rater_user_id === rater_user_id,
        );

        official_states = assigned_official_ids
            .map((official_id) => {
                const official = officials_map.get(official_id);
                if (!official) return null;
                const found = rater_ratings.find(
                    (r) => r.official_id === official_id,
                );
                return {
                    official,
                    rating: found
                        ? {
                              overall: found.overall,
                              decision_accuracy: found.decision_accuracy,
                              game_control: found.game_control,
                              communication: found.communication,
                              fitness: found.fitness,
                              notes: found.notes,
                          }
                        : build_default_dimensions(),
                    existing_id: found?.id ?? null,
                    is_saving: false,
                    validation_errors: [] as string[],
                };
            })
            .filter((s): s is OfficialRatingState => s !== null);

        is_loading = false;
    }

    async function submit_rating(state: OfficialRatingState): Promise<void> {
        const input: CreateOfficialPerformanceRatingInput = {
            organization_id,
            official_id: state.official.id,
            fixture_id,
            rater_user_id,
            rater_role,
            overall: state.rating.overall,
            decision_accuracy: state.rating.decision_accuracy,
            game_control: state.rating.game_control,
            communication: state.rating.communication,
            fitness: state.rating.fitness,
            notes: state.rating.notes,
            submitted_at: new Date().toISOString(),
            status: "active",
        };

        const errors = validate_rating_input(input);
        state.validation_errors = errors;
        official_states = official_states;

        if (errors.length > 0) return;

        state.is_saving = true;
        official_states = official_states;

        const result = await rating_use_cases.submit_or_update_rating(input);

        state.is_saving = false;
        if (result.success && result.data) {
            state.existing_id = result.data.id;
            toast_message = `Rating submitted for ${get_official_full_name(state.official)}`;
            toast_type = "success";
        } else {
            toast_message = !result.success ? result.error : "Failed to submit rating";
            toast_type = "error";
        }
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

{#if is_loading}
    <p class="text-center text-sm text-gray-500 py-4">Loading officials...</p>
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

                {#each [{ key: "overall", label: "Overall" }, { key: "decision_accuracy", label: "Decision Accuracy" }, { key: "game_control", label: "Game Control" }, { key: "communication", label: "Communication" }, { key: "fitness", label: "Fitness & Mobility" }] as dim}
                    <div class="flex items-center gap-3 mb-2">
                        <label for="dim-{state.official.id}-{dim.key}" class="w-40 text-sm text-gray-600 shrink-0"
                            >{dim.label}</label
                        >
                        <input
                            id="dim-{state.official.id}-{dim.key}"
                            type="range"
                            min="1"
                            max="10"
                            step="1"
                            bind:value={(state.rating as unknown as Record<string, number>)[dim.key]}
                            class="flex-1 accent-emerald-500"
                        />
                        <span
                            class="w-6 text-center text-sm font-medium text-gray-700"
                        >
                            {(state.rating as unknown as Record<string, number>)[dim.key]}
                        </span>
                    </div>
                {/each}

                <div class="mt-3">
                    <label for="notes-{state.official.id}" class="text-sm text-gray-600">Notes (optional)</label
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
