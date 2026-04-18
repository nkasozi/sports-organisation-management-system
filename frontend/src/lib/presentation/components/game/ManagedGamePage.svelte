<script lang="ts">
    import type { Fixture } from "$lib/core/entities/Fixture";
    import type { FixtureUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/FixtureUseCasesPort";
    import type {
        ManagedGameLoadResult,
        ManagedGameStartCheck,
    } from "$lib/presentation/logic/managedGamePageTypes";

    import ManagedGamePageController from "./ManagedGamePageController.svelte";

    export let back_path!: string;
    export let back_button_label!: string;
    export let error_title!: string;
    export let event_modal_component!: any;
    export let fixture_use_cases!: Pick<
        FixtureUseCasesPort,
        "start_fixture" | "end_fixture" | "record_game_event" | "update_period"
    >;
    export let load_bundle!: (
        fixture_id: string,
    ) => Promise<ManagedGameLoadResult>;
    export let before_start!: (fixture: Fixture) => Promise<ManagedGameStartCheck>;
</script>

<ManagedGamePageController
    {back_path}
    {back_button_label}
    {error_title}
    {event_modal_component}
    {fixture_use_cases}
    {load_bundle}
    {before_start}
/>
