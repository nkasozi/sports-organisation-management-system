<script lang="ts">
    import { onMount } from "svelte";

    import { get_concept_definition } from "$lib/presentation/logic/conceptGuideCatalog";
    import { read_profile_organization_id } from "$lib/presentation/logic/conceptGuideCurrentUser";
    import { create_concept_guide_sources } from "$lib/presentation/logic/conceptGuideDependencies";
    import { load_concept_guide_snapshot } from "$lib/presentation/logic/conceptGuideLoader";
    import { find_next_concept_step } from "$lib/presentation/logic/conceptGuideNextStep";
    import {
        build_guide_route_checker,
        choose_guide_organization_id,
        type GuideOption,
        load_guide_competitions,
        load_guide_organizations,
        to_guide_options,
    } from "$lib/presentation/logic/conceptGuidePageState";
    import { build_concept_progress } from "$lib/presentation/logic/conceptGuideProgress";
    import {
        CONCEPT_ID,
        type ConceptGuideSnapshot,
        type ConceptId,
    } from "$lib/presentation/logic/conceptGuideTypes";
    import { sidebar_menu_items } from "$lib/presentation/stores/authDerivedStores";

    import ConceptGuideDetailPanel from "./ConceptGuideDetailPanel.svelte";
    import ConceptGuideInfoDialog from "./ConceptGuideInfoDialog.svelte";
    import ConceptGuideLanes from "./ConceptGuideLanes.svelte";
    import ConceptGuideNextStep from "./ConceptGuideNextStep.svelte";

    const sources = create_concept_guide_sources();
    const NO_INFO = "";
    const GUIDE_LOAD_STATUS = { LOADING: "loading", READY: "ready" } as const;

    let organization_options: GuideOption[] = [];
    let competition_options: GuideOption[] = [];
    let organization_id = "";
    let competition_id = "";
    let snapshot_state:
        | { status: typeof GUIDE_LOAD_STATUS.LOADING }
        | {
              status: typeof GUIDE_LOAD_STATUS.READY;
              snapshot: ConceptGuideSnapshot;
          } = {
        status: GUIDE_LOAD_STATUS.LOADING,
    };
    let selected_concept_id: ConceptId = CONCEPT_ID.ORGANIZATION;
    let info_concept_id: ConceptId | typeof NO_INFO = NO_INFO;

    $: can_open = build_guide_route_checker($sidebar_menu_items);

    async function refresh_snapshot(): Promise<boolean> {
        const competition = competition_options.find(
            (option) => option.value === competition_id,
        );
        const snapshot = await load_concept_guide_snapshot(
            sources,
            organization_id,
            competition
                ? { id: competition.value, name: competition.label }
                : false,
        );
        snapshot_state = { status: GUIDE_LOAD_STATUS.READY, snapshot };
        selected_concept_id = find_next_concept_step(snapshot).concept_id;
        return true;
    }

    async function select_organization(next_id: string): Promise<boolean> {
        organization_id = next_id;
        competition_options = (
            await load_guide_competitions(sources, organization_id)
        ).map((competition) => ({
            value: competition.id,
            label: competition.name,
        }));
        competition_id = competition_options[0]?.value ?? "";
        return refresh_snapshot();
    }

    onMount(async () => {
        const organizations = await load_guide_organizations(sources);
        organization_options = to_guide_options(organizations);
        await select_organization(
            choose_guide_organization_id(
                organizations,
                read_profile_organization_id(),
            ),
        );
    });
</script>

<div class="max-w-6xl mx-auto space-y-5">
    <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
            <h1 class="text-2xl font-bold text-accent-900 dark:text-accent-100">
                How it all fits together
            </h1>
            <p class="text-sm text-gray-600 dark:text-gray-400">
                What each part of SportSync is for, how they connect, and what
                to do next. Tap the ⓘ on any card for the full story.
            </p>
        </div>
        <div class="flex flex-wrap gap-2">
            {#if organization_options.length > 1}
                <select
                    class="select-styled w-full sm:w-auto sm:min-w-[240px]"
                    aria-label="Organization"
                    value={organization_id}
                    on:change={(event) =>
                        void select_organization(event.currentTarget.value)}
                >
                    {#each organization_options as option (option.value)}
                        <option value={option.value}>{option.label}</option>
                    {/each}
                </select>
            {/if}
            {#if competition_options.length > 0}
                <select
                    class="select-styled w-full sm:w-auto sm:min-w-[240px]"
                    aria-label="Competition"
                    bind:value={competition_id}
                    on:change={() => void refresh_snapshot()}
                >
                    {#each competition_options as option (option.value)}
                        <option value={option.value}>{option.label}</option>
                    {/each}
                </select>
            {/if}
        </div>
    </div>

    {#if snapshot_state.status === GUIDE_LOAD_STATUS.LOADING}
        <div class="flex justify-center py-12">
            <div
                class="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"
            ></div>
        </div>
    {:else}
        {@const progress = build_concept_progress(snapshot_state.snapshot)}
        {@const next_step = find_next_concept_step(snapshot_state.snapshot)}
        {@const next_concept = get_concept_definition(next_step.concept_id)}
        <ConceptGuideNextStep
            {next_step}
            route={next_concept.route}
            can_open_route={can_open(next_concept.route)}
            on_show_concept={() => (info_concept_id = next_step.concept_id)}
        />
        <ConceptGuideLanes
            {progress}
            {selected_concept_id}
            on_select={(concept_id) => (selected_concept_id = concept_id)}
            on_info={(concept_id) => (info_concept_id = concept_id)}
        />
        <ConceptGuideDetailPanel
            concept={get_concept_definition(selected_concept_id)}
            progress={progress[selected_concept_id]}
            can_open_route={can_open(
                get_concept_definition(selected_concept_id).route,
            )}
            on_select_concept={(concept_id) =>
                (selected_concept_id = concept_id)}
            on_info={() => (info_concept_id = selected_concept_id)}
        />
    {/if}
</div>

{#if info_concept_id !== NO_INFO}
    <ConceptGuideInfoDialog
        concept={get_concept_definition(info_concept_id)}
        can_open_route={can_open(get_concept_definition(info_concept_id).route)}
        on_open_concept={(concept_id) => (info_concept_id = concept_id)}
        on_close={() => (info_concept_id = NO_INFO)}
    />
{/if}
