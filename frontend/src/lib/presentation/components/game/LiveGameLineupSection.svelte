<script lang="ts">
    import type { Fixture } from "$lib/core/entities/Fixture";
    import type {
        LineupPlayer,
        PlayerTimeOnStatus,
    } from "$lib/core/entities/FixtureLineup";

    import LiveGameLineupCard from "./LiveGameLineupCard.svelte";

    interface $$Props {
        away_lineup_expanded: boolean;
        away_players: LineupPlayer[];
        away_starters: LineupPlayer[];
        away_substitutes: LineupPlayer[];
        away_team_name: string;
        elapsed_minutes: number;
        fixture_status: Fixture["status"];
        home_lineup_expanded: boolean;
        home_players: LineupPlayer[];
        home_starters: LineupPlayer[];
        home_substitutes: LineupPlayer[];
        home_team_name: string;
        is_game_active: boolean;
        on_away_time_on_change: (
            player_id: string,
            new_time_on: PlayerTimeOnStatus,
        ) => Promise<boolean>;
        on_home_time_on_change: (
            player_id: string,
            new_time_on: PlayerTimeOnStatus,
        ) => Promise<boolean>;
        on_toggle_away_lineup: () => void;
        on_toggle_home_lineup: () => void;
    }

    export let away_lineup_expanded: boolean;
    export let away_players: LineupPlayer[];
    export let away_starters: LineupPlayer[];
    export let away_substitutes: LineupPlayer[];
    export let away_team_name: string;
    export let elapsed_minutes: number;
    export let fixture_status: Fixture["status"];
    export let home_lineup_expanded: boolean;
    export let home_players: LineupPlayer[];
    export let home_starters: LineupPlayer[];
    export let home_substitutes: LineupPlayer[];
    export let home_team_name: string;
    export let is_game_active: boolean;
    export let on_away_time_on_change: (
        player_id: string,
        new_time_on: PlayerTimeOnStatus,
    ) => Promise<boolean>;
    export let on_home_time_on_change: (
        player_id: string,
        new_time_on: PlayerTimeOnStatus,
    ) => Promise<boolean>;
    export let on_toggle_away_lineup: () => void;
    export let on_toggle_home_lineup: () => void;

    $: expandable = fixture_status !== "scheduled";
    $: home_expanded = expandable ? home_lineup_expanded : true;
    $: away_expanded = expandable ? away_lineup_expanded : true;
    $: grid_class = expandable
        ? "grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
        : "grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6";
</script>

<div class={grid_class}>
    <LiveGameLineupCard
        accent="blue"
        icon="🏠"
        team_name={home_team_name}
        players={home_players}
        starters={home_starters}
        substitutes={home_substitutes}
        expanded={home_expanded}
        {expandable}
        {is_game_active}
        {elapsed_minutes}
        on_toggle={on_toggle_home_lineup}
        on_time_on_change={on_home_time_on_change}
    />
    <LiveGameLineupCard
        accent="red"
        icon="✈️"
        team_name={away_team_name}
        players={away_players}
        starters={away_starters}
        substitutes={away_substitutes}
        expanded={away_expanded}
        {expandable}
        {is_game_active}
        {elapsed_minutes}
        on_toggle={on_toggle_away_lineup}
        on_time_on_change={on_away_time_on_change}
    />
</div>
