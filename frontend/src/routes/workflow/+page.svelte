<script lang="ts">
  import { onMount } from "svelte";
  import UiWizardStepper from "$lib/components/UiWizardStepper.svelte";
  import EntityCrudWrapper from "$lib/components/EntityCrudWrapper.svelte";
  import type { BaseEntity } from "$lib/core/BaseEntity";
  import { unifiedApiService } from "$lib/core/UnifiedApiService";

  // Wizard step configuration
  interface WizardStep {
    step_key: string;
    step_title: string;
    step_description?: string;
    is_completed: boolean;
    is_optional: boolean;
    entity_type: string;
  }

  let wizard_steps: WizardStep[] = [
    {
      step_key: "organization",
      step_title: "Organization",
      step_description: "Create your sports organization",
      is_completed: false,
      is_optional: false,
      entity_type: "organization",
    },
    {
      step_key: "competition",
      step_title: "Competition",
      step_description: "Set up competition details",
      is_completed: false,
      is_optional: false,
      entity_type: "competition",
    },
    {
      step_key: "constraints",
      step_title: "Constraints",
      step_description: "Define game rules and constraints",
      is_completed: false,
      is_optional: true,
      entity_type: "competition_constraint",
    },
    {
      step_key: "teams",
      step_title: "Teams",
      step_description: "Add participating teams",
      is_completed: false,
      is_optional: false,
      entity_type: "team",
    },
    {
      step_key: "players",
      step_title: "Players",
      step_description: "Register team players",
      is_completed: false,
      is_optional: true,
      entity_type: "player",
    },
    {
      step_key: "officials",
      step_title: "Officials",
      step_description: "Add referees and officials",
      is_completed: false,
      is_optional: false,
      entity_type: "official",
    },
    {
      step_key: "games",
      step_title: "Games",
      step_description: "Schedule and manage games",
      is_completed: false,
      is_optional: false,
      entity_type: "game",
    },
    {
      step_key: "review",
      step_title: "Review",
      step_description: "Final review and completion",
      is_completed: false,
      is_optional: false,
      entity_type: "",
    },
  ];

  let current_step_index: number = 0;
  let workflow_entities: Record<string, BaseEntity[]> = {};
  let is_mobile_view: boolean = true;

  // References to components
  let wizard_stepper_component: UiWizardStepper;

  $: current_step = get_current_step_info(wizard_steps, current_step_index);
  $: should_show_crud_wrapper = determine_if_crud_wrapper_needed(
    current_step?.step_key
  );

  onMount(() => {
    detect_mobile_view();
    load_existing_workflow_data();
  });

  function detect_mobile_view(): void {
    if (typeof window !== "undefined") {
      is_mobile_view = window.innerWidth < 768;
      window.addEventListener("resize", () => {
        is_mobile_view = window.innerWidth < 768;
      });
    }
  }

  function get_current_step_info(
    steps: WizardStep[],
    index: number
  ): WizardStep | null {
    if (index < 0 || index >= steps.length) return null;
    return steps[index];
  }

  function determine_if_crud_wrapper_needed(
    step_key: string | undefined
  ): boolean {
    return step_key !== "review" && step_key !== undefined;
  }

  async function load_existing_workflow_data(): Promise<void> {
    // Load any existing entities to check completion status
    for (const step of wizard_steps) {
      if (step.entity_type) {
        const result = await unifiedApiService.get_all_entities<BaseEntity>(
          step.entity_type
        );
        if (result.success) {
          workflow_entities[step.entity_type] = result.data;
          // Mark step as completed if entities exist
          if (result.data.length > 0) {
            step.is_completed = true;
          }
        }
      }
    }
    wizard_steps = wizard_steps; // Trigger reactivity
  }

  function handle_step_changed(
    event: CustomEvent<{
      previous_index: number;
      new_index: number;
      step: WizardStep;
    }>
  ): void {
    current_step_index = event.detail.new_index;
    console.log(
      `Workflow step changed from ${event.detail.previous_index} to ${event.detail.new_index}`
    );
  }

  function handle_step_completed(
    event: CustomEvent<{ step_index: number; step: WizardStep }>
  ): void {
    console.log(`Workflow step completed: ${event.detail.step.step_title}`);
  }

  function handle_wizard_completed(
    event: CustomEvent<{ completed_steps: WizardStep[] }>
  ): void {
    console.log("Workflow wizard completed successfully");
    // Could navigate to dashboard or show success message
  }

  function handle_wizard_cancelled(): void {
    console.log("Workflow wizard cancelled");
    // Could show confirmation dialog or navigate away
  }

  function handle_entity_created(
    event: CustomEvent<{ entity: BaseEntity }>
  ): void {
    const created_entity = event.detail.entity;
    const current_entity_type = current_step?.entity_type;

    if (current_entity_type) {
      if (!workflow_entities[current_entity_type]) {
        workflow_entities[current_entity_type] = [];
      }
      workflow_entities[current_entity_type].push(created_entity);

      // Mark current step as completed
      if (current_step) {
        current_step.is_completed = true;
        wizard_steps = wizard_steps; // Trigger reactivity
      }
    }

    console.log(`Entity created in workflow: ${created_entity.id}`);
  }

  function handle_entity_updated(
    event: CustomEvent<{ entity: BaseEntity }>
  ): void {
    const updated_entity = event.detail.entity;
    const current_entity_type = current_step?.entity_type;

    if (current_entity_type && workflow_entities[current_entity_type]) {
      const entity_index = workflow_entities[current_entity_type].findIndex(
        (e) => e.id === updated_entity.id
      );
      if (entity_index !== -1) {
        workflow_entities[current_entity_type][entity_index] = updated_entity;
      }
    }

    console.log(`Entity updated in workflow: ${updated_entity.id}`);
  }

  function handle_entity_deleted(
    event: CustomEvent<{ entity: BaseEntity }>
  ): void {
    const deleted_entity = event.detail.entity;
    const current_entity_type = current_step?.entity_type;

    if (current_entity_type && workflow_entities[current_entity_type]) {
      workflow_entities[current_entity_type] = workflow_entities[
        current_entity_type
      ].filter((e) => e.id !== deleted_entity.id);

      // Update completion status based on remaining entities
      if (current_step) {
        current_step.is_completed =
          workflow_entities[current_entity_type].length > 0;
        wizard_steps = wizard_steps; // Trigger reactivity
      }
    }

    console.log(`Entity deleted in workflow: ${deleted_entity.id}`);
  }

  function handle_entities_deleted(
    event: CustomEvent<{ entities: BaseEntity[] }>
  ): void {
    const deleted_entities = event.detail.entities;
    const current_entity_type = current_step?.entity_type;

    if (current_entity_type && workflow_entities[current_entity_type]) {
      const deleted_ids = deleted_entities.map((e) => e.id);
      workflow_entities[current_entity_type] = workflow_entities[
        current_entity_type
      ].filter((e) => !deleted_ids.includes(e.id));

      // Update completion status
      if (current_step) {
        current_step.is_completed =
          workflow_entities[current_entity_type].length > 0;
        wizard_steps = wizard_steps; // Trigger reactivity
      }
    }

    console.log(
      `Multiple entities deleted in workflow: ${deleted_entities.length} items`
    );
  }

  function get_workflow_summary(): Record<string, number> {
    const summary: Record<string, number> = {};
    for (const [entity_type, entities] of Object.entries(workflow_entities)) {
      summary[entity_type] = entities.length;
    }
    return summary;
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

    <!-- Main Wizard Container -->
    <UiWizardStepper
      bind:this={wizard_stepper_component}
      steps={wizard_steps}
      {current_step_index}
      {is_mobile_view}
      allow_skip_steps={true}
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
      {#if should_show_crud_wrapper && current_step?.entity_type}
        <!-- CRUD wrapper for entity management -->
        <div class="step-content-wrapper">
          <div class="mb-6 text-center">
            <h2
              class="text-xl font-semibold text-accent-900 dark:text-accent-100 mb-2"
            >
              {current_step.step_title}
            </h2>
            {#if current_step.step_description}
              <p class="text-accent-600 dark:text-accent-400">
                {current_step.step_description}
              </p>
            {/if}
          </div>

          <EntityCrudWrapper
            entity_type={current_step.entity_type}
            initial_view="list"
            {is_mobile_view}
            show_list_actions={true}
            on:entity_created={handle_entity_created}
            on:entity_updated={handle_entity_updated}
            on:entity_deleted={handle_entity_deleted}
            on:entities_deleted={handle_entities_deleted}
          />
        </div>
      {:else if current_step?.step_key === "review"}
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

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {#each Object.entries(get_workflow_summary()) as [entity_type, count]}
                <div
                  class="stat-card bg-accent-50 dark:bg-accent-900/20 p-4 rounded-lg"
                >
                  <div
                    class="text-2xl font-bold text-accent-600 dark:text-accent-400"
                  >
                    {count}
                  </div>
                  <div
                    class="text-sm text-accent-700 dark:text-accent-300 capitalize"
                  >
                    {entity_type.replace("_", " ")}
                  </div>
                </div>
              {/each}
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

  .stat-card {
    text-align: center;
    transition: transform 0.2s ease-in-out;
  }

  .stat-card:hover {
    transform: translateY(-1px);
  }

  /* Mobile-first responsive adjustments */
  @media (max-width: 640px) {
    .workflow-page {
      padding: 1rem 0;
    }

    .step-content-wrapper {
      min-height: 400px;
    }
  }
</style>
