<script lang="ts">
    import {
        get_fixture_use_cases,
        get_player_use_cases,
        get_team_use_cases,
    } from "$lib/infrastructure/registry/useCaseFactories";
    import { load_game_manage_bundle } from "$lib/presentation/logic/gameManageData";

    import GameManageEventModal from "./GameManageEventModal.svelte";
    import ManagedGamePage from "./ManagedGamePage.svelte";

    const fixture_use_cases = get_fixture_use_cases();
    const team_use_cases = get_team_use_cases();
    const player_use_cases = get_player_use_cases();
    const event_modal_component = GameManageEventModal;
    const load_bundle = (fixture_id: string) =>
        load_game_manage_bundle(fixture_id, {
            fixture_use_cases,
            team_use_cases,
            player_use_cases,
        });
    const before_start = async () => ({ allowed: true }) as const;
</script>

<ManagedGamePage
    back_path="/games"
    back_button_label="Back to Games"
    error_title="Error Loading Game"
    {event_modal_component}
    {fixture_use_cases}
    {load_bundle}
    {before_start}
/>
