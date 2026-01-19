<script lang="ts">
  import { createEventDispatcher, onDestroy } from "svelte";
  import type { Game, ActiveGame, GameEvent } from "$lib/core/entities/GameEntities";
  import type {
    Sport,
    CardType,
    ScoringRule,
    SportGamePeriod,
  } from "$lib/core/entities/Sport";
  export let selected_games: Game[] = [];
  export let current_sport: Sport | null = null;

  const dispatch = createEventDispatcher<{
    game_started: { game: Game };
    game_paused: { active_game: ActiveGame };
    game_resumed: { active_game: ActiveGame };
    game_ended: { active_game: ActiveGame };
    event_recorded: { active_game: ActiveGame; event: Partial<GameEvent> };
    lineup_submitted: { active_game: ActiveGame; lineup: LineupEntry[] };
  }>();

  interface LineupEntry {
    player_id: string;
    player_name: string;
    jersey_number: number;
    position: string;
    is_starter: boolean;
    team_side: "home" | "away";
  }

  interface QuickEventType {
    id: string;
    label: string;
    icon: string;
    color: string;
    category: "score" | "card" | "foul" | "substitution" | "period" | "other";
    requires_player: boolean;
    affects_score: boolean;
  }

  let current_active_game: ActiveGame | null = null;
  let game_events: GameEvent[] = [];
  let game_clock_seconds: number = 0;
  let clock_interval: ReturnType<typeof setInterval> | null = null;
  let is_clock_running: boolean = false;
  let current_period_index: number = 0;
  let stoppage_time_seconds: number = 0;
  let is_in_stoppage_time: boolean = false;

  let show_lineup_modal: boolean = false;
  let show_event_modal: boolean = false;
  let selected_event_type: QuickEventType | null = null;
  let selected_team_side: "home" | "away" = "home";

  let home_lineup: LineupEntry[] = [];
  let away_lineup: LineupEntry[] = [];
  let lineups_confirmed: boolean = false;

  let event_form = create_empty_event_form();

  function create_empty_event_form(): {
    player_id: string;
    player_name: string;
    secondary_player_id: string;
    secondary_player_name: string;
    description: string;
    card_type: string;
    scoring_rule: string;
  } {
    return {
      player_id: "",
      player_name: "",
      secondary_player_id: "",
      secondary_player_name: "",
      description: "",
      card_type: "",
      scoring_rule: "",
    };
  }

  function get_quick_event_types(): QuickEventType[] {
    const base_events: QuickEventType[] = [
      {
        id: "goal",
        label: "Goal",
        icon: "⚽",
        color: "bg-green-500",
        category: "score",
        requires_player: true,
        affects_score: true,
      },
      {
        id: "own_goal",
        label: "Own Goal",
        icon: "🥅",
        color: "bg-orange-500",
        category: "score",
        requires_player: true,
        affects_score: true,
      },
      {
        id: "penalty_goal",
        label: "Penalty",
        icon: "🎯",
        color: "bg-green-600",
        category: "score",
        requires_player: true,
        affects_score: true,
      },
      {
        id: "penalty_miss",
        label: "Pen Miss",
        icon: "❌",
        color: "bg-red-400",
        category: "other",
        requires_player: true,
        affects_score: false,
      },
      {
        id: "yellow_card",
        label: "Yellow",
        icon: "🟨",
        color: "bg-yellow-400",
        category: "card",
        requires_player: true,
        affects_score: false,
      },
      {
        id: "red_card",
        label: "Red",
        icon: "🟥",
        color: "bg-red-500",
        category: "card",
        requires_player: true,
        affects_score: false,
      },
      {
        id: "second_yellow",
        label: "2nd Yellow",
        icon: "🟨🟥",
        color: "bg-orange-500",
        category: "card",
        requires_player: true,
        affects_score: false,
      },
      {
        id: "substitution",
        label: "Sub",
        icon: "🔄",
        color: "bg-blue-500",
        category: "substitution",
        requires_player: true,
        affects_score: false,
      },
      {
        id: "foul",
        label: "Foul",
        icon: "⚠️",
        color: "bg-amber-500",
        category: "foul",
        requires_player: true,
        affects_score: false,
      },
      {
        id: "offside",
        label: "Offside",
        icon: "🚫",
        color: "bg-purple-500",
        category: "other",
        requires_player: false,
        affects_score: false,
      },
      {
        id: "corner",
        label: "Corner",
        icon: "🚩",
        color: "bg-teal-500",
        category: "other",
        requires_player: false,
        affects_score: false,
      },
      {
        id: "free_kick",
        label: "Free Kick",
        icon: "🦵",
        color: "bg-indigo-500",
        category: "other",
        requires_player: false,
        affects_score: false,
      },
      {
        id: "injury",
        label: "Injury",
        icon: "🏥",
        color: "bg-red-600",
        category: "other",
        requires_player: true,
        affects_score: false,
      },
      {
        id: "var_review",
        label: "VAR",
        icon: "📺",
        color: "bg-gray-600",
        category: "other",
        requires_player: false,
        affects_score: false,
      },
      {
        id: "timeout",
        label: "Timeout",
        icon: "⏸️",
        color: "bg-slate-500",
        category: "other",
        requires_player: false,
        affects_score: false,
      },
    ];

    if (current_sport?.card_types) {
      const sport_cards = current_sport.card_types.map(
        (card): QuickEventType => ({
          id: card.id,
          label: card.name,
          icon: card.severity === "ejection" ? "🟥" : "🟨",
          color: `bg-[${card.color}]`,
          category: "card",
          requires_player: true,
          affects_score: false,
        })
      );
      return [
        ...base_events.filter((e) => e.category !== "card"),
        ...sport_cards,
      ];
    }

    return base_events;
  }

  function get_game_periods(): SportGamePeriod[] {
    if (current_sport?.periods && current_sport.periods.length > 0) {
      return [...current_sport.periods].sort((a, b) => a.order - b.order);
    }
    return [
      {
        id: "first_half",
        name: "1st Half",
        duration_minutes: 45,
        is_break: false,
        order: 1,
      },
      {
        id: "half_time",
        name: "Half Time",
        duration_minutes: 15,
        is_break: true,
        order: 2,
      },
      {
        id: "second_half",
        name: "2nd Half",
        duration_minutes: 45,
        is_break: false,
        order: 3,
      },
    ];
  }

  function get_card_types(): CardType[] {
    return (
      current_sport?.card_types ?? [
        {
          id: "yellow_card",
          name: "Yellow Card",
          color: "#facc15",
          severity: "warning",
          description: "Warning",
          consequences: [],
        },
        {
          id: "red_card",
          name: "Red Card",
          color: "#ef4444",
          severity: "ejection",
          description: "Ejection",
          consequences: [],
        },
      ]
    );
  }

  function get_scoring_rules(): ScoringRule[] {
    return (
      current_sport?.scoring_rules ?? [
        { event_type: "goal", points_awarded: 1, description: "Standard goal" },
      ]
    );
  }

  $: sorted_events = [...game_events].sort((a, b) => {
    const time_a =
      a.attributes.event_minute * 60 + (a.attributes.stoppage_time_minute || 0);
    const time_b =
      b.attributes.event_minute * 60 + (b.attributes.stoppage_time_minute || 0);
    return time_b - time_a;
  });

  $: home_score = game_events
    .filter(
      (e) => e.attributes.team_id === "home_team" && e.attributes.affects_score
    )
    .reduce((sum, e) => sum + (e.attributes.score_change_home || 0), 0);

  $: away_score = game_events
    .filter(
      (e) => e.attributes.team_id === "away_team" && e.attributes.affects_score
    )
    .reduce((sum, e) => sum + (e.attributes.score_change_away || 0), 0);

  $: current_minute = Math.floor(game_clock_seconds / 60);
  $: current_seconds = game_clock_seconds % 60;
  $: stoppage_minutes = Math.floor(stoppage_time_seconds / 60);

  $: current_period = get_game_periods()[current_period_index];
  $: is_playing_period = current_period && !current_period.is_break;
  $: can_record_events =
    current_active_game && is_playing_period && lineups_confirmed;

  onDestroy(() => {
    stop_clock();
  });

  function start_selected_game(game: Game): void {
    const now = new Date().toISOString();
    const new_active_game: ActiveGame = {
      id: `active_${game.id}`,
      created_at: now,
      updated_at: now,
      attributes: {
        game_id: game.id,
        current_status: "pre_game",
        current_minute: 0,
        stoppage_time_minutes: 0,
        home_team_score: 0,
        away_team_score: 0,
        last_event_timestamp: now,
        game_started_by_user_id: "current_user",
      },
    };
    current_active_game = new_active_game;
    game_events = [];
    game_clock_seconds = 0;
    current_period_index = 0;
    lineups_confirmed = false;
    show_lineup_modal = true;
    dispatch("game_started", { game });
  }

  function confirm_lineups(): void {
    if (home_lineup.length === 0 || away_lineup.length === 0) {
      return;
    }
    lineups_confirmed = true;
    show_lineup_modal = false;
    dispatch("lineup_submitted", {
      active_game: current_active_game!,
      lineup: [...home_lineup, ...away_lineup],
    });
  }

  function start_clock(): void {
    if (clock_interval) return;
    is_clock_running = true;
    clock_interval = setInterval(() => {
      if (is_in_stoppage_time) {
        stoppage_time_seconds++;
      } else {
        game_clock_seconds++;
      }
    }, 1000);
  }

  function stop_clock(): void {
    if (clock_interval) {
      clearInterval(clock_interval);
      clock_interval = null;
    }
    is_clock_running = false;
  }

  function toggle_clock(): void {
    is_clock_running ? stop_clock() : start_clock();
  }

  function add_stoppage_time(minutes: number): void {
    is_in_stoppage_time = true;
    stoppage_time_seconds += minutes * 60;
  }

  function start_period(): void {
    if (!current_period) return;

    record_period_event("period_start", `${current_period.name} started`);

    if (!current_period.is_break) {
      start_clock();
    }

    if (current_active_game) {
      const status_map: Record<
        string,
        ActiveGame["attributes"]["current_status"]
      > = {
        first_half: "first_half",
        "1st Half": "first_half",
        second_half: "second_half",
        "2nd Half": "second_half",
        extra_time: "extra_time",
        "Extra Time": "extra_time",
      };
      current_active_game.attributes.current_status =
        status_map[current_period.id] ||
        status_map[current_period.name] ||
        "first_half";
    }
  }

  function end_period(): void {
    if (!current_period) return;

    stop_clock();
    record_period_event("period_end", `${current_period.name} ended`);

    is_in_stoppage_time = false;
    stoppage_time_seconds = 0;

    const periods = get_game_periods();
    if (current_period_index < periods.length - 1) {
      current_period_index++;
      game_clock_seconds = 0;

      if (current_active_game) {
        current_active_game.attributes.current_status = "half_time";
      }
    } else {
      end_game();
    }
  }

  function record_period_event(
    event_type: "period_start" | "period_end",
    description: string
  ): void {
    const now = new Date().toISOString();
    const new_event: GameEvent = {
      id: `event_${Date.now()}`,
      created_at: now,
      updated_at: now,
      attributes: {
        active_game_id: current_active_game?.id || "",
        event_type,
        event_minute: current_minute,
        stoppage_time_minute: is_in_stoppage_time
          ? Math.floor(stoppage_time_seconds / 60)
          : undefined,
        team_id: "match",
        description,
        affects_score: false,
        score_change_home: 0,
        score_change_away: 0,
        recorded_by_user_id: "current_user",
        recorded_at: now,
        reviewed: false,
      },
    };
    game_events = [...game_events, new_event];
  }

  function end_game(): void {
    if (!current_active_game) return;
    stop_clock();
    current_active_game.attributes.current_status = "finished";
    current_active_game.attributes.home_team_score = home_score;
    current_active_game.attributes.away_team_score = away_score;

    record_period_event("period_end", "Full Time");
    dispatch("game_ended", { active_game: current_active_game });
  }

  function open_event_modal(
    event_type: QuickEventType,
    team: "home" | "away"
  ): void {
    if (!can_record_events) return;
    selected_event_type = event_type;
    selected_team_side = team;
    event_form = create_empty_event_form();
    show_event_modal = true;
  }

  function cancel_event(): void {
    show_event_modal = false;
    selected_event_type = null;
    event_form = create_empty_event_form();
  }

  function record_event(): void {
    if (!current_active_game || !selected_event_type) return;

    let score_change_home = 0;
    let score_change_away = 0;
    let affects_score = selected_event_type.affects_score;
    let event_description = event_form.description || selected_event_type.label;

    if (affects_score) {
      const scoring_rule = get_scoring_rules().find(
        (r) => r.event_type === "goal"
      );
      const points = scoring_rule?.points_awarded ?? 1;

      if (selected_event_type.id === "own_goal") {
        if (selected_team_side === "home") {
          score_change_away = points;
        } else {
          score_change_home = points;
        }
      } else {
        if (selected_team_side === "home") {
          score_change_home = points;
        } else {
          score_change_away = points;
        }
      }
    }

    const event_timestamp = new Date().toISOString();
    const new_event: GameEvent = {
      id: `event_${Date.now()}`,
      created_at: event_timestamp,
      updated_at: event_timestamp,
      attributes: {
        active_game_id: current_active_game.id,
        event_type:
          selected_event_type.id as GameEvent["attributes"]["event_type"],
        event_minute: current_minute,
        stoppage_time_minute: is_in_stoppage_time
          ? Math.floor(stoppage_time_seconds / 60)
          : undefined,
        team_id: selected_team_side === "home" ? "home_team" : "away_team",
        player_id: event_form.player_id || undefined,
        secondary_player_id: event_form.secondary_player_id || undefined,
        description: event_description,
        affects_score,
        score_change_home,
        score_change_away,
        recorded_by_user_id: "current_user",
        recorded_at: event_timestamp,
        reviewed: false,
      },
    };

    game_events = [...game_events, new_event];
    current_active_game.attributes.last_event_timestamp =
      new Date().toISOString();
    current_active_game.attributes.home_team_score =
      home_score + score_change_home;
    current_active_game.attributes.away_team_score =
      away_score + score_change_away;

    dispatch("event_recorded", {
      active_game: current_active_game,
      event: new_event,
    });
    cancel_event();
  }

  function get_event_icon(event: GameEvent): string {
    const icon_map: Record<string, string> = {
      goal: "⚽",
      own_goal: "🥅",
      penalty_goal: "🎯",
      penalty_miss: "❌",
      yellow_card: "🟨",
      red_card: "🟥",
      second_yellow: "🟨",
      substitution: "🔄",
      foul: "⚠️",
      offside: "🚫",
      corner: "🚩",
      free_kick: "🦵",
      injury: "🏥",
      var_review: "📺",
      timeout: "⏸️",
      period_start: "▶️",
      period_end: "⏹️",
    };
    return icon_map[event.attributes.event_type] || "📋";
  }

  function get_event_color_class(event: GameEvent): string {
    const type = event.attributes.event_type;
    if (type === "red_card")
      return "border-l-red-500 bg-red-50 dark:bg-red-900/20";
    if (type === "yellow_card")
      return "border-l-yellow-400 bg-yellow-50 dark:bg-yellow-900/20";
    if (event.attributes.affects_score)
      return "border-l-green-500 bg-green-50 dark:bg-green-900/20";
    if (type === "substitution")
      return "border-l-blue-500 bg-blue-50 dark:bg-blue-900/20";
    if (type === "period_start" || type === "period_end")
      return "border-l-purple-500 bg-purple-50 dark:bg-purple-900/20";
    return "border-l-gray-300 bg-gray-50 dark:bg-gray-800";
  }

  function format_event_time(event: GameEvent): string {
    const minute = event.attributes.event_minute;
    const stoppage = event.attributes.stoppage_time_minute;
    return stoppage ? `${minute}+${stoppage}'` : `${minute}'`;
  }

  function format_clock_display(): string {
    const min = current_minute.toString().padStart(2, "0");
    const sec = current_seconds.toString().padStart(2, "0");
    if (is_in_stoppage_time) {
      const stop_min = stoppage_minutes.toString().padStart(2, "0");
      return `${min}:${sec} +${stop_min}`;
    }
    return `${min}:${sec}`;
  }

  function get_team_players(side: "home" | "away"): LineupEntry[] {
    return side === "home" ? home_lineup : away_lineup;
  }

  function add_player_to_lineup(side: "home" | "away"): void {
    const new_player: LineupEntry = {
      player_id: `player_${Date.now()}`,
      player_name: "",
      jersey_number: 0,
      position: "",
      is_starter: true,
      team_side: side,
    };
    if (side === "home") {
      home_lineup = [...home_lineup, new_player];
    } else {
      away_lineup = [...away_lineup, new_player];
    }
  }

  function remove_player_from_lineup(
    side: "home" | "away",
    index: number
  ): void {
    if (side === "home") {
      home_lineup = home_lineup.filter((_, i) => i !== index);
    } else {
      away_lineup = away_lineup.filter((_, i) => i !== index);
    }
  }
</script>

<div class="live-game-management min-h-screen bg-gray-100 dark:bg-gray-900">
  {#if !current_active_game}
    <div class="p-4 sm:p-6">
      <div class="text-center mb-6">
        <h2
          class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2"
        >
          🏟️ Live Game Management
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Select a scheduled game to begin officiating
        </p>
      </div>

      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto"
      >
        {#each selected_games as game}
          <div
            class="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div
              class="bg-theme-primary-500 dark:bg-theme-primary-600 px-4 py-2"
            >
              <span class="text-xs font-medium text-white">
                {game.attributes?.scheduled_date} • {game.attributes
                  ?.scheduled_time}
              </span>
            </div>
            <div class="p-4">
              <div class="flex items-center justify-between mb-4">
                <div class="text-center flex-1">
                  <div
                    class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full mx-auto mb-2 flex items-center justify-center"
                  >
                    <span
                      class="text-lg font-bold text-blue-600 dark:text-blue-400"
                      >H</span
                    >
                  </div>
                  <span
                    class="text-sm font-medium text-gray-900 dark:text-white"
                    >Home</span
                  >
                </div>
                <div class="px-4">
                  <span class="text-2xl font-bold text-gray-400">VS</span>
                </div>
                <div class="text-center flex-1">
                  <div
                    class="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-2 flex items-center justify-center"
                  >
                    <span
                      class="text-lg font-bold text-red-600 dark:text-red-400"
                      >A</span
                    >
                  </div>
                  <span
                    class="text-sm font-medium text-gray-900 dark:text-white"
                    >Away</span
                  >
                </div>
              </div>
              <div
                class="text-xs text-gray-500 dark:text-gray-400 text-center mb-4"
              >
                📍 {game.attributes?.venue || "Venue TBD"}
              </div>
              <button
                class="w-full bg-theme-primary-500 hover:bg-theme-primary-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                on:click={() => start_selected_game(game)}
              >
                ▶️ Start Officiating
              </button>
            </div>
          </div>
        {/each}
      </div>

      {#if selected_games.length === 0}
        <div class="text-center py-16">
          <div
            class="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center"
          >
            <span class="text-4xl">🏟️</span>
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Games Scheduled
          </h3>
          <p class="text-gray-500 dark:text-gray-400">
            There are no games available for live management
          </p>
        </div>
      {/if}
    </div>
  {:else}
    <div class="flex flex-col h-screen">
      <div class="bg-gray-900 text-white px-4 py-3 sticky top-0 z-40">
        <div class="flex items-center justify-between max-w-4xl mx-auto">
          <div class="flex items-center gap-6">
            <div class="text-center">
              <div class="text-xs text-gray-400 mb-1">HOME</div>
              <div class="text-4xl font-bold tabular-nums">{home_score}</div>
            </div>

            <div class="text-center">
              <div class="text-xs text-gray-400 mb-1">
                {current_period?.name || "Pre-Game"}
              </div>
              <div class="text-2xl font-mono font-bold text-theme-primary-400">
                {format_clock_display()}
              </div>
              {#if is_clock_running}
                <div
                  class="w-2 h-2 bg-green-500 rounded-full mx-auto mt-1 animate-pulse"
                ></div>
              {/if}
            </div>

            <div class="text-center">
              <div class="text-xs text-gray-400 mb-1">AWAY</div>
              <div class="text-4xl font-bold tabular-nums">{away_score}</div>
            </div>
          </div>

          <div class="flex gap-2">
            {#if is_playing_period}
              <button
                class="px-3 py-2 rounded-lg text-sm font-medium {is_clock_running
                  ? 'bg-yellow-500 text-black'
                  : 'bg-green-500 text-white'}"
                on:click={toggle_clock}
              >
                {is_clock_running ? "⏸️ Pause" : "▶️ Resume"}
              </button>
            {/if}
            <button
              class="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium"
              on:click={end_game}
            >
              🏁 End
            </button>
          </div>
        </div>
      </div>

      {#if lineups_confirmed}
        <div class="bg-gray-800 text-white px-4 py-2 border-b border-gray-700">
          <div class="flex justify-center gap-4 max-w-4xl mx-auto">
            {#if !is_clock_running && current_period}
              {#if current_period.is_break}
                <button
                  class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium"
                  on:click={() => {
                    current_period_index++;
                  }}
                >
                  ⏭️ Next Period
                </button>
              {:else}
                <button
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium"
                  on:click={start_period}
                >
                  ▶️ Start {current_period.name}
                </button>
              {/if}
            {:else if is_clock_running}
              <button
                class="px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg text-sm font-medium"
                on:click={() => add_stoppage_time(1)}
              >
                +1' Stoppage
              </button>
              <button
                class="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm font-medium"
                on:click={end_period}
              >
                ⏹️ End {current_period?.name}
              </button>
            {/if}
          </div>
        </div>

        {#if can_record_events}
          <div
            class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3"
          >
            <div class="max-w-4xl mx-auto">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div
                    class="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2 text-center"
                  >
                    🏠 HOME TEAM
                  </div>
                  <div class="grid grid-cols-3 gap-2">
                    {#each get_quick_event_types().slice(0, 6) as event_type}
                      <button
                        class="quick-event-btn {event_type.color} text-white"
                        on:click={() => open_event_modal(event_type, "home")}
                      >
                        <span class="text-lg">{event_type.icon}</span>
                        <span class="text-xs">{event_type.label}</span>
                      </button>
                    {/each}
                  </div>
                </div>
                <div>
                  <div
                    class="text-xs font-medium text-red-600 dark:text-red-400 mb-2 text-center"
                  >
                    ✈️ AWAY TEAM
                  </div>
                  <div class="grid grid-cols-3 gap-2">
                    {#each get_quick_event_types().slice(0, 6) as event_type}
                      <button
                        class="quick-event-btn {event_type.color} text-white"
                        on:click={() => open_event_modal(event_type, "away")}
                      >
                        <span class="text-lg">{event_type.icon}</span>
                        <span class="text-xs">{event_type.label}</span>
                      </button>
                    {/each}
                  </div>
                </div>
              </div>

              <div
                class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
              >
                <div
                  class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 text-center"
                >
                  MORE EVENTS
                </div>
                <div class="flex flex-wrap justify-center gap-2">
                  {#each get_quick_event_types().slice(6) as event_type}
                    <button
                      class="px-3 py-1.5 rounded-lg text-xs font-medium {event_type.color} text-white flex items-center gap-1"
                      on:click={() => {
                        selected_team_side = "home";
                        open_event_modal(event_type, selected_team_side);
                      }}
                    >
                      {event_type.icon}
                      {event_type.label}
                    </button>
                  {/each}
                </div>
              </div>
            </div>
          </div>
        {/if}
      {/if}

      <div class="flex-1 overflow-y-auto px-4 py-4">
        <div class="max-w-2xl mx-auto">
          <h3
            class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4"
          >
            Match Timeline
          </h3>

          {#if sorted_events.length === 0}
            <div class="text-center py-12">
              <div
                class="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center"
              >
                <span class="text-3xl">📋</span>
              </div>
              <p class="text-gray-500 dark:text-gray-400 text-sm">
                No events recorded yet
              </p>
              <p class="text-gray-400 dark:text-gray-500 text-xs mt-1">
                {lineups_confirmed
                  ? "Use the quick buttons above to record events"
                  : "Confirm lineups to start recording"}
              </p>
            </div>
          {:else}
            <div class="relative">
              <div
                class="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600"
              ></div>

              <div class="space-y-3">
                {#each sorted_events as event}
                  <div class="relative flex items-start gap-4 pl-2">
                    <div class="flex-shrink-0 w-14 text-right">
                      <span
                        class="text-sm font-bold text-gray-900 dark:text-white"
                      >
                        {format_event_time(event)}
                      </span>
                    </div>

                    <div
                      class="flex-shrink-0 w-10 h-10 rounded-full bg-white dark:bg-gray-800 border-4 border-gray-300 dark:border-gray-600 flex items-center justify-center text-lg z-10 shadow-sm"
                    >
                      {get_event_icon(event)}
                    </div>

                    <div class="flex-1 min-w-0">
                      <div
                        class="rounded-lg border-l-4 p-3 shadow-sm {get_event_color_class(
                          event
                        )}"
                      >
                        <div
                          class="flex items-center justify-between gap-2 mb-1"
                        >
                          <span
                            class="font-semibold text-gray-900 dark:text-white text-sm"
                          >
                            {event.attributes.description}
                          </span>
                          {#if event.attributes.team_id !== "match"}
                            <span
                              class="text-xs px-2 py-0.5 rounded-full {event
                                .attributes.team_id === 'home_team'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}"
                            >
                              {event.attributes.team_id === "home_team"
                                ? "HOME"
                                : "AWAY"}
                            </span>
                          {/if}
                        </div>
                        {#if event.attributes.player_id}
                          <p class="text-xs text-gray-500 dark:text-gray-400">
                            Player: {event.attributes.player_id}
                          </p>
                        {/if}
                        {#if event.attributes.affects_score}
                          <p
                            class="text-xs font-medium text-green-600 dark:text-green-400 mt-1"
                          >
                            Score: {home_score} - {away_score}
                          </p>
                        {/if}
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  {#if show_lineup_modal}
    <div
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
    >
      <div
        class="bg-white dark:bg-gray-800 w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div class="bg-theme-primary-500 px-6 py-4">
          <h3 class="text-xl font-bold text-white">
            📋 Confirm Starting Lineups
          </h3>
          <p class="text-theme-primary-100 text-sm">
            Enter player details for both teams before starting
          </p>
        </div>

        <div class="flex-1 overflow-y-auto p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div class="flex items-center justify-between mb-4">
                <h4 class="font-semibold text-blue-600 dark:text-blue-400">
                  🏠 Home Team
                </h4>
                <button
                  class="text-xs px-3 py-1 bg-blue-500 text-white rounded-lg"
                  on:click={() => add_player_to_lineup("home")}
                >
                  + Add Player
                </button>
              </div>
              <div class="space-y-2">
                {#each home_lineup as player, index}
                  <div
                    class="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg"
                  >
                    <input
                      type="number"
                      bind:value={player.jersey_number}
                      placeholder="#"
                      class="w-12 px-2 py-1 text-center text-sm border rounded"
                    />
                    <input
                      type="text"
                      bind:value={player.player_name}
                      placeholder="Player Name"
                      class="flex-1 px-2 py-1 text-sm border rounded"
                    />
                    <input
                      type="text"
                      bind:value={player.position}
                      placeholder="Pos"
                      class="w-16 px-2 py-1 text-sm border rounded"
                    />
                    <button
                      class="text-red-500 hover:text-red-700"
                      on:click={() => remove_player_from_lineup("home", index)}
                    >
                      ✕
                    </button>
                  </div>
                {/each}
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-4">
                <h4 class="font-semibold text-red-600 dark:text-red-400">
                  ✈️ Away Team
                </h4>
                <button
                  class="text-xs px-3 py-1 bg-red-500 text-white rounded-lg"
                  on:click={() => add_player_to_lineup("away")}
                >
                  + Add Player
                </button>
              </div>
              <div class="space-y-2">
                {#each away_lineup as player, index}
                  <div
                    class="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg"
                  >
                    <input
                      type="number"
                      bind:value={player.jersey_number}
                      placeholder="#"
                      class="w-12 px-2 py-1 text-center text-sm border rounded"
                    />
                    <input
                      type="text"
                      bind:value={player.player_name}
                      placeholder="Player Name"
                      class="flex-1 px-2 py-1 text-sm border rounded"
                    />
                    <input
                      type="text"
                      bind:value={player.position}
                      placeholder="Pos"
                      class="w-16 px-2 py-1 text-sm border rounded"
                    />
                    <button
                      class="text-red-500 hover:text-red-700"
                      on:click={() => remove_player_from_lineup("away", index)}
                    >
                      ✕
                    </button>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>

        <div
          class="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3"
        >
          <button
            class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            on:click={() => {
              current_active_game = null;
              show_lineup_modal = false;
            }}
          >
            Cancel
          </button>
          <button
            class="px-6 py-2 bg-theme-primary-500 hover:bg-theme-primary-600 text-white font-medium rounded-lg disabled:opacity-50"
            disabled={home_lineup.length === 0 || away_lineup.length === 0}
            on:click={confirm_lineups}
          >
            ✓ Confirm & Start
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if show_event_modal && selected_event_type}
    <div
      class="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
    >
      <div
        class="bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-xl shadow-2xl"
      >
        <div
          class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"
        >
          <div class="flex items-center gap-3">
            <span class="text-2xl">{selected_event_type.icon}</span>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white">
                {selected_event_type.label}
              </h3>
              <span
                class="text-xs {selected_team_side === 'home'
                  ? 'text-blue-600'
                  : 'text-red-600'}"
              >
                {selected_team_side === "home"
                  ? "🏠 Home Team"
                  : "✈️ Away Team"}
              </span>
            </div>
          </div>
          <button
            aria-label="Close event form"
            class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            on:click={cancel_event}
          >
            <svg
              class="w-5 h-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form on:submit|preventDefault={record_event} class="p-4 space-y-4">
          <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-center">
            <span
              class="text-2xl font-mono font-bold text-gray-900 dark:text-white"
            >
              {format_clock_display()}
            </span>
          </div>

          {#if selected_event_type.requires_player}
            <div>
              <label
                for="player-select"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Player
              </label>
              <select
                id="player-select"
                bind:value={event_form.player_id}
                class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">Select player...</option>
                {#each get_team_players(selected_team_side) as player}
                  <option value={player.player_id}
                    >#{player.jersey_number} {player.player_name}</option
                  >
                {/each}
              </select>
            </div>
          {/if}

          {#if selected_event_type.category === "substitution"}
            <div>
              <label
                for="sub-player-select"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Player Coming On
              </label>
              <select
                id="sub-player-select"
                bind:value={event_form.secondary_player_id}
                class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">Select player...</option>
                {#each get_team_players(selected_team_side).filter((p) => !p.is_starter) as player}
                  <option value={player.player_id}
                    >#{player.jersey_number} {player.player_name}</option
                  >
                {/each}
              </select>
            </div>
          {/if}

          {#if selected_event_type.category === "card"}
            <div>
              <span
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >Card Type</span
              >
              <div
                class="grid grid-cols-2 gap-2"
                role="group"
                aria-label="Card type selection"
              >
                {#each get_card_types() as card}
                  <button
                    type="button"
                    class="p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all {event_form.card_type ===
                    card.id
                      ? 'ring-2 ring-offset-2 ring-theme-primary-500'
                      : ''}"
                    style="border-color: {card.color}; background-color: {card.color}20"
                    on:click={() => (event_form.card_type = card.id)}
                  >
                    <span
                      class="w-6 h-8 rounded"
                      style="background-color: {card.color}"
                    ></span>
                    <span class="text-sm font-medium">{card.name}</span>
                  </button>
                {/each}
              </div>
            </div>
          {/if}

          <div>
            <label
              for="event-notes"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Notes (Optional)
            </label>
            <textarea
              id="event-notes"
              bind:value={event_form.description}
              placeholder="Additional details..."
              class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 h-16 resize-none"
            ></textarea>
          </div>

          <div class="flex gap-3 pt-2">
            <button
              type="button"
              class="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium"
              on:click={cancel_event}
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-3 bg-theme-primary-500 hover:bg-theme-primary-600 text-white rounded-lg font-medium"
            >
              ✓ Record Event
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>

<style>
  .quick-event-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    border-radius: 0.5rem;
    font-weight: 500;
    transition:
      transform 0.1s,
      opacity 0.1s;
    min-height: 3.5rem;
  }

  .quick-event-btn:active {
    transform: scale(0.95);
    opacity: 0.9;
  }

  .tabular-nums {
    font-variant-numeric: tabular-nums;
  }
</style>
