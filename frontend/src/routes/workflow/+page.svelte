<script lang="ts">
  import { onMount } from "svelte";
  import UiWizardStepper from "$lib/components/UiWizardStepper.svelte";
  import EntityCrudWrapper from "$lib/components/EntityCrudWrapper.svelte";
  import LiveGameManagement from "$lib/components/LiveGameManagement.svelte";
  import type { BaseEntity } from "$lib/core/BaseEntity";
  import {
    WorkflowStateMachine,
    type WorkflowMachineState,
  } from "$lib/core/WorkflowStateMachine";
  import type { Game, ActiveGame, GameEvent } from "$lib/core/GameEntities";

  interface EntityWithAttributes extends BaseEntity {
    attributes?: Record<string, unknown>;
  }

  function get_entity_display_name(
    entity: BaseEntity,
    fallback: string
  ): string {
    const entity_with_attrs = entity as EntityWithAttributes;
    if (
      entity_with_attrs.attributes &&
      typeof entity_with_attrs.attributes.name === "string"
    ) {
      return entity_with_attrs.attributes.name;
    }
    if (
      entity_with_attrs.attributes &&
      typeof entity_with_attrs.attributes.description === "string"
    ) {
      return entity_with_attrs.attributes.description;
    }
    return fallback;
  }

  // Initialize the workflow state machine
  const workflow_state_machine = new WorkflowStateMachine();
  let current_workflow_state: WorkflowMachineState =
    workflow_state_machine.create_initial_workflow_state();
  let is_mobile_view: boolean = true;

  // References to components
  let wizard_stepper_component: UiWizardStepper;
  let current_crud_wrapper_component: EntityCrudWrapper;

  // Computed values
  $: current_step_definition =
    workflow_state_machine.get_current_step_definition(current_workflow_state);
  $: current_step_state = workflow_state_machine.get_current_step_state(
    current_workflow_state
  );
  $: progress_percentage =
    workflow_state_machine.get_workflow_progress_percentage(
      current_workflow_state
    );
  $: is_workflow_complete = workflow_state_machine.is_workflow_complete(
    current_workflow_state
  );

  // Create wizard step format for UiWizardStepper component
  $: wizard_steps = workflow_state_machine.get_wizard_steps_for_ui(
    current_workflow_state
  );

  // Debug information (can be removed later)
  $: console.log("Current step definition:", current_step_definition);
  $: console.log("Current step state:", current_step_state);
  $: console.log("Wizard steps for UI:", wizard_steps);

  $: current_step_index = workflow_state_machine
    .get_step_order()
    .indexOf(current_workflow_state.current_step_id);

  onMount(() => {
    detect_mobile_view();
    console.log("Workflow initialized with state machine");
  });

  function detect_mobile_view(): void {
    if (typeof window !== "undefined") {
      is_mobile_view = window.innerWidth < 768;
    }
  }

  function handle_entity_selection_changed(
    event: CustomEvent<{ selected_entities: BaseEntity[] }>
  ): void {
    const selected_entities = event.detail.selected_entities;
    console.log(
      `Selection changed: ${selected_entities.length} entities selected for step ${current_step_definition.step_id}`
    );

    // Update the workflow state with new selection
    const transition_result = workflow_state_machine.update_step_selection(
      current_workflow_state,
      current_step_definition.step_id,
      selected_entities
    );

    if (transition_result.success) {
      current_workflow_state = transition_result.new_state;
      const updated_step_state = workflow_state_machine.get_current_step_state(
        current_workflow_state
      );
      console.log(
        `Step ${current_step_definition.step_id} validation: ${updated_step_state.is_selection_valid ? "VALID" : "INVALID"}`
      );
      console.log(
        `Can proceed to next step: ${current_workflow_state.can_proceed_to_next_step}`
      );
      console.log(`Updated wizard steps:`, wizard_steps);

      if (!updated_step_state.is_selection_valid) {
        console.log(
          `Validation error: ${updated_step_state.validation_error_message}`
        );
      }
    } else {
      console.error(
        `Failed to update selection: ${transition_result.error_message}`
      );
    }
  }

  function handle_step_changed(
    event: CustomEvent<{
      previous_index: number;
      new_index: number;
      step: any;
    }>
  ): void {
    console.log(
      `Step navigation requested: ${event.detail.previous_index} -> ${event.detail.new_index}`
    );

    // Determine if this is forward or backward navigation
    if (event.detail.new_index > event.detail.previous_index) {
      // Forward navigation - use state machine transition
      const transition_result = workflow_state_machine.transition_to_next_step(
        current_workflow_state
      );
      if (transition_result.success) {
        current_workflow_state = transition_result.new_state;
        console.log(`Advanced to step: ${current_step_definition.step_id}`);
      } else {
        console.error(
          `Cannot advance to next step: ${transition_result.error_message}`
        );
        // Keep current step and show error
      }
    } else {
      // Backward navigation
      const transition_result =
        workflow_state_machine.transition_to_previous_step(
          current_workflow_state
        );
      if (transition_result.success) {
        current_workflow_state = transition_result.new_state;
        console.log(`Moved back to step: ${current_step_definition.step_id}`);
      } else {
        console.error(`Cannot go back: ${transition_result.error_message}`);
      }
    }
  }

  function handle_step_completed(
    event: CustomEvent<{ step_index: number; step: any }>
  ): void {
    console.log(`Step completion event: ${current_step_definition.step_id}`);
  }

  function handle_wizard_completed(
    event: CustomEvent<{ completed_steps: any[] }>
  ): void {
    console.log("Workflow completed successfully");
    if (is_workflow_complete) {
      console.log(
        "All workflow selections:",
        current_workflow_state.workflow_entities
      );
    }
  }

  function handle_wizard_cancelled(): void {
    console.log("Workflow cancelled");
  }

  // Legacy entity event handlers - these will trigger state updates
  function handle_entity_created(
    event: CustomEvent<{ entity: BaseEntity }>
  ): void {
    console.log(
      `Entity created: ${event.detail.entity.id} for ${current_step_definition.entity_type}`
    );
    // When an entity is created, automatically select it
    const new_selection = [
      ...current_step_state.selected_entities,
      event.detail.entity,
    ];
    handle_entity_selection_changed({
      detail: { selected_entities: new_selection },
    } as CustomEvent<{ selected_entities: BaseEntity[] }>);
  }

  function handle_entity_updated(
    event: CustomEvent<{ entity: BaseEntity }>
  ): void {
    console.log(`Entity updated: ${event.detail.entity.id}`);
    // Update the entity in current selection if it exists
    const updated_selection = current_step_state.selected_entities.map(
      (entity) =>
        entity.id === event.detail.entity.id ? event.detail.entity : entity
    );
    handle_entity_selection_changed({
      detail: { selected_entities: updated_selection },
    } as CustomEvent<{ selected_entities: BaseEntity[] }>);
  }

  function handle_entity_deleted(
    event: CustomEvent<{ entity: BaseEntity }>
  ): void {
    console.log(`Entity deleted: ${event.detail.entity.id}`);
    // Remove from current selection if it exists
    const updated_selection = current_step_state.selected_entities.filter(
      (entity) => entity.id !== event.detail.entity.id
    );
    handle_entity_selection_changed({
      detail: { selected_entities: updated_selection },
    } as CustomEvent<{ selected_entities: BaseEntity[] }>);
  }

  function handle_entities_deleted(
    event: CustomEvent<{ entities: BaseEntity[] }>
  ): void {
    const deleted_ids = event.detail.entities.map((e) => e.id);
    console.log(`Multiple entities deleted: ${deleted_ids.length} items`);
    // Remove all deleted entities from current selection
    const updated_selection = current_step_state.selected_entities.filter(
      (entity) => !deleted_ids.includes(entity.id)
    );
    handle_entity_selection_changed({
      detail: { selected_entities: updated_selection },
    } as CustomEvent<{ selected_entities: BaseEntity[] }>);
  }

  function should_show_crud_wrapper(): boolean {
    return (
      current_step_definition && current_step_definition.entity_type !== ""
    );
  }

  function should_show_live_game_management(): boolean {
    return (
      current_step_definition &&
      current_step_definition.step_id === "game_management"
    );
  }

  // Game management state
  let is_in_live_mode: boolean = false;
  let selected_game_for_live_management: Game | null = null;

  function enter_live_game_management(game: Game): void {
    console.log("Entering live management for game:", game);
    selected_game_for_live_management = game;
    is_in_live_mode = true;
  }

  function exit_live_game_management(): void {
    console.log("Exiting live management mode");
    is_in_live_mode = false;
    selected_game_for_live_management = null;
  }

  // Game management event handlers
  function handle_game_started(event: CustomEvent<{ game: Game }>): void {
    console.log("Game started:", event.detail.game);
  }

  function handle_game_paused(
    event: CustomEvent<{ active_game: ActiveGame }>
  ): void {
    console.log("Game paused:", event.detail.active_game);
  }

  function handle_game_resumed(
    event: CustomEvent<{ active_game: ActiveGame }>
  ): void {
    console.log("Game resumed:", event.detail.active_game);
  }

  function handle_game_ended(
    event: CustomEvent<{ active_game: ActiveGame }>
  ): void {
    console.log("Game ended:", event.detail.active_game);
  }

  function handle_event_recorded(
    event: CustomEvent<{ active_game: ActiveGame; event: Partial<GameEvent> }>
  ): void {
    console.log("Game event recorded:", event.detail.event);
  }
</script>

<svelte:head>
  <title>Workflow Wizard - Sports Management</title>
</svelte:head>

<div
  class="workflow-page min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-8"
>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Workflow Header -->
    <div class="text-center mb-8">
      <h1
        class="text-2xl sm:text-3xl font-bold text-accent-900 dark:text-accent-100 mb-2"
      >
        Sports Management Workflow
      </h1>
      <p class="text-accent-600 dark:text-accent-400 max-w-2xl mx-auto">
        Complete setup for your sports organization by following these guided
        steps. Each step builds upon the previous one to create a comprehensive
        management system.
      </p>
    </div>

    <!-- Display validation error if current step is invalid -->
    {#if !current_step_state.is_selection_valid && current_step_state.validation_error_message}
      <div
        class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded"
      >
        <strong>Selection Required:</strong>
        {current_step_state.validation_error_message}
      </div>
    {/if}

    <!-- Main Wizard Container -->
    <UiWizardStepper
      bind:this={wizard_stepper_component}
      steps={wizard_steps}
      current_step_index={workflow_state_machine.get_current_step_index(
        current_workflow_state
      )}
      {is_mobile_view}
      allow_skip_steps={false}
      on:step_changed={handle_step_changed}
      on:step_completed={handle_step_completed}
      on:wizard_completed={handle_wizard_completed}
      on:wizard_cancelled={handle_wizard_cancelled}
      let:current_step
      let:step_index
      let:can_go_previous
      let:can_go_next
      let:is_final
    >
      <!-- Dynamic step content based on current step -->
      {#if should_show_live_game_management() && is_in_live_mode}
        <!-- Live Game Management Interface -->
        <div class="live-game-step-wrapper">
          <div class="mb-4">
            <button
              class="btn btn-outline"
              on:click={exit_live_game_management}
            >
              ← Back to Game List
            </button>
          </div>

          <LiveGameManagement
            selected_games={selected_game_for_live_management
              ? [selected_game_for_live_management]
              : []}
            on:game_started={handle_game_started}
            on:game_paused={handle_game_paused}
            on:game_resumed={handle_game_resumed}
            on:game_ended={handle_game_ended}
            on:event_recorded={handle_event_recorded}
          />
        </div>
      {:else if should_show_crud_wrapper()}
        <!-- CRUD wrapper for entity management -->
        <div class="step-content-wrapper">
          <div class="mb-6 text-center">
            <h2
              class="text-xl font-semibold text-accent-900 dark:text-accent-100 mb-2"
            >
              {current_step_definition.step_name}
            </h2>
            {#if current_step_definition.step_description}
              <p class="text-accent-600 dark:text-accent-400">
                {current_step_definition.step_description}
              </p>
            {/if}
          </div>

          {#key current_step_definition.step_id}
            <EntityCrudWrapper
              bind:this={current_crud_wrapper_component}
              entity_type={current_step_definition.entity_type}
              initial_view="list"
              {is_mobile_view}
              show_list_actions={true}
              on:entity_created={handle_entity_created}
              on:entity_updated={handle_entity_updated}
              on:entity_deleted={handle_entity_deleted}
              on:entities_deleted={handle_entities_deleted}
              on:selection_changed={handle_entity_selection_changed}
            />
          {/key}
        </div>
      {:else}
        <!-- Final review step -->
        <div class="review-step-content">
          <div class="text-center mb-8">
            <h2
              class="text-xl font-semibold text-accent-900 dark:text-accent-100 mb-2"
            >
              Workflow Complete
            </h2>
            <p class="text-accent-600 dark:text-accent-400">
              Review your setup and begin managing your sports organization.
            </p>
          </div>

          <!-- Workflow summary -->
          <div class="card p-6 space-y-6">
            <h3
              class="text-lg font-semibold text-accent-900 dark:text-accent-100"
            >
              Setup Summary
            </h3>

            <!-- Debug info (can be removed later) -->
            <div class="bg-gray-100 p-2 text-xs">
              <p><strong>Debug - Workflow Entities:</strong></p>
              <pre>{JSON.stringify(
                  current_workflow_state.workflow_entities,
                  null,
                  2
                )}</pre>
            </div>

            <div class="space-y-4">
              <div class="border rounded-lg p-4">
                <h4 class="font-semibold text-lg mb-2">
                  Selected Organization
                </h4>
                {#if current_workflow_state.workflow_entities.organization}
                  {#each current_workflow_state.workflow_entities.organization as org}
                    <p class="text-gray-700">
                      {get_entity_display_name(org, org.id)}
                    </p>
                  {/each}
                {:else}
                  <p class="text-gray-500">No organization selected</p>
                {/if}
              </div>

              <div class="border rounded-lg p-4">
                <h4 class="font-semibold text-lg mb-2">Selected Competition</h4>
                {#if current_workflow_state.workflow_entities.competition}
                  {#each current_workflow_state.workflow_entities.competition as comp}
                    <p class="text-gray-700">
                      {get_entity_display_name(comp, comp.id)}
                    </p>
                  {/each}
                {:else}
                  <p class="text-gray-500">No competition selected</p>
                {/if}
              </div>

              <div class="border rounded-lg p-4">
                <h4 class="font-semibold text-lg mb-2">
                  Selected Teams ({current_workflow_state.workflow_entities.team
                    ?.length || 0})
                </h4>
                {#if current_workflow_state.workflow_entities.team && current_workflow_state.workflow_entities.team.length > 0}
                  {#each current_workflow_state.workflow_entities.team as team}
                    <p class="text-gray-700">
                      • {get_entity_display_name(team, team.id)}
                    </p>
                  {/each}
                {:else}
                  <p class="text-gray-500">No teams selected</p>
                {/if}
              </div>

              {#if current_workflow_state.workflow_entities.player && current_workflow_state.workflow_entities.player.length > 0}
                <div class="border rounded-lg p-4">
                  <h4 class="font-semibold text-lg mb-2">
                    Selected Players ({current_workflow_state.workflow_entities
                      .player.length})
                  </h4>
                  {#each current_workflow_state.workflow_entities.player as player}
                    <p class="text-gray-700">
                      • {get_entity_display_name(player, player.id)}
                    </p>
                  {/each}
                </div>
              {/if}

              <div class="border rounded-lg p-4">
                <h4 class="font-semibold text-lg mb-2">
                  Selected Officials ({current_workflow_state.workflow_entities
                    .official?.length || 0})
                </h4>
                {#if current_workflow_state.workflow_entities.official && current_workflow_state.workflow_entities.official.length > 0}
                  {#each current_workflow_state.workflow_entities.official as official}
                    <p class="text-gray-700">
                      • {get_entity_display_name(official, official.id)}
                    </p>
                  {/each}
                {:else}
                  <p class="text-gray-500">No officials selected</p>
                {/if}
              </div>

              {#if current_workflow_state.workflow_entities.game && current_workflow_state.workflow_entities.game.length > 0}
                <div class="border rounded-lg p-4">
                  <h4 class="font-semibold text-lg mb-2">
                    Created Games ({current_workflow_state.workflow_entities
                      .game.length})
                  </h4>
                  {#each current_workflow_state.workflow_entities.game as game}
                    <p class="text-gray-700">
                      • {get_entity_display_name(game, `Game ${game.id}`)}
                    </p>
                  {/each}
                </div>
              {/if}

              {#if current_workflow_state.workflow_entities.game_assignment && current_workflow_state.workflow_entities.game_assignment.length > 0}
                <div class="border rounded-lg p-4">
                  <h4 class="font-semibold text-lg mb-2">
                    Game Assignments ({current_workflow_state.workflow_entities
                      .game_assignment.length})
                  </h4>
                  {#each current_workflow_state.workflow_entities.game_assignment as assignment}
                    <p class="text-gray-700">
                      • {get_entity_display_name(
                        assignment,
                        `Assignment ${assignment.id}`
                      )}
                    </p>
                  {/each}
                </div>
              {/if}

              {#if current_workflow_state.workflow_entities.active_game && current_workflow_state.workflow_entities.active_game.length > 0}
                <div class="border rounded-lg p-4">
                  <h4 class="font-semibold text-lg mb-2">
                    Active Games ({current_workflow_state.workflow_entities
                      .active_game.length})
                  </h4>
                  {#each current_workflow_state.workflow_entities.active_game as active_game}
                    <p class="text-gray-700">
                      • {get_entity_display_name(
                        active_game,
                        `Active Game ${active_game.id}`
                      )}
                    </p>
                  {/each}
                </div>
              {/if}
            </div>

            <div
              class="text-center pt-6 border-t border-gray-200 dark:border-gray-700"
            >
              <p class="text-accent-600 dark:text-accent-400 mb-4">
                Your sports organization is ready! You can now manage
                competitions, schedule games, and track events.
              </p>

              <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/" class="btn btn-outline"> Go to Dashboard </a>
                <button
                  class="btn btn-secondary"
                  on:click={() =>
                    wizard_stepper_component?.complete_current_step()}
                >
                  Complete Setup
                </button>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </UiWizardStepper>
  </div>
</div>

<style>
  .workflow-page {
    min-height: 100vh;
  }

  .step-content-wrapper {
    min-height: 500px;
  }

  .review-step-content {
    min-height: 400px;
  }

  @media (max-width: 640px) {
    .workflow-page {
      padding: 1rem 0;
    }

    .step-content-wrapper {
      min-height: 400px;
    }
  }
</style>
