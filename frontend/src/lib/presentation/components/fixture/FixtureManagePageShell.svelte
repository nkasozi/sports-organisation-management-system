<script lang="ts">
    import type { Fixture } from "$lib/core/entities/Fixture";
    import {
        get_fixture_lineup_use_cases,
        get_fixture_use_cases,
        get_player_position_use_cases,
        get_player_team_membership_use_cases,
        get_player_use_cases,
        get_team_use_cases,
    } from "$lib/infrastructure/registry/useCaseFactories";
    import ManagedGamePage from "$lib/presentation/components/game/ManagedGamePage.svelte";
    import { load_fixture_manage_bundle } from "$lib/presentation/logic/fixtureManageData";
    import { has_team_submitted_lineup } from "$lib/presentation/logic/fixtureManageState";
    import type { ManagedGameStartCheck } from "$lib/presentation/logic/managedGamePageTypes";

    import FixtureManageEventModal from "./FixtureManageEventModal.svelte";
    import {
        FIXTURE_MANAGE_LOG_EVENTS,
        FIXTURE_MANAGE_TEXT,
    } from "./fixtureManageMessages";

    const fixture_use_cases = get_fixture_use_cases();
    const fixture_lineup_use_cases = get_fixture_lineup_use_cases();
    const team_use_cases = get_team_use_cases();
    const player_use_cases = get_player_use_cases();
    const player_team_membership_use_cases =
        get_player_team_membership_use_cases();
    const player_position_use_cases = get_player_position_use_cases();
    const event_modal_component = FixtureManageEventModal;
    const load_bundle = (fixture_id: string) =>
        load_fixture_manage_bundle(fixture_id, {
            fixture_use_cases,
            team_use_cases,
            player_use_cases,
            player_team_membership_use_cases,
            player_position_use_cases,
        });

    async function before_start(
        fixture: Fixture,
    ): Promise<ManagedGameStartCheck> {
        const result = await fixture_lineup_use_cases.get_lineups_for_fixture(
            fixture.id,
        );
        if (!result.success) {
            console.error("[FixtureManage] Lineup check failed", {
                event: FIXTURE_MANAGE_LOG_EVENTS.LINEUP_CHECK_FAILED,
                fixture_id: fixture.id,
                error: result.error,
            });
            return {
                allowed: false,
                message: FIXTURE_MANAGE_TEXT.LINEUP_CHECK_FAILED,
                message_type: "error",
            };
        }
        const home_lineup_ready = has_team_submitted_lineup(
            result.data ?? [],
            fixture.home_team_id,
        );
        const away_lineup_ready = has_team_submitted_lineup(
            result.data ?? [],
            fixture.away_team_id,
        );
        if (home_lineup_ready && away_lineup_ready) return { allowed: true };
        return {
            allowed: false,
            message: FIXTURE_MANAGE_TEXT.LINEUPS_REQUIRED,
            message_type: "info",
            redirect_path: `${FIXTURE_MANAGE_TEXT.LINEUPS_PATH}?${FIXTURE_MANAGE_TEXT.FIXTURE_ID_QUERY_PARAM}=${encodeURIComponent(fixture.id)}`,
        };
    }
</script>

<ManagedGamePage
    back_path={FIXTURE_MANAGE_TEXT.BACK_PATH}
    back_button_label={FIXTURE_MANAGE_TEXT.BACK_BUTTON_LABEL}
    error_title={FIXTURE_MANAGE_TEXT.ERROR_TITLE}
    {event_modal_component}
    {fixture_use_cases}
    {load_bundle}
    {before_start}
/>
