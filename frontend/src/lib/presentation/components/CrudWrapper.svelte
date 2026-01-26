<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let title: string;
  export let entity_name: string;
  export let show_create = true;
  export let show_list = true;
  export const show_edit = true;
  export const show_delete = true;

  let current_view: "list" | "create" | "edit" = "list";
  let selected_entity: any = null;

  const dispatch = createEventDispatcher();

  function format_entity_display_name(raw_name: string): string {
    if (typeof raw_name !== "string" || raw_name.length === 0) return "Entity";
    const with_spaces = raw_name
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ");
    return with_spaces
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  $: formatted_entity_name = format_entity_display_name(entity_name);

  function show_create_form(): void {
    current_view = "create";
    selected_entity = null;
  }

  function show_list_view(): void {
    current_view = "list";
    selected_entity = null;
  }

  function show_edit_form(entity: any): void {
    current_view = "edit";
    selected_entity = entity;
  }

  function handle_entity_created(event: CustomEvent): void {
    dispatch("entity-created", event.detail);
    current_view = "list";
  }

  function handle_entity_updated(event: CustomEvent): void {
    dispatch("entity-updated", event.detail);
    current_view = "list";
  }

  function handle_entity_deleted(event: CustomEvent): void {
    dispatch("entity-deleted", event.detail);
    current_view = "list";
  }
</script>

<div class="crud-container">
  <!-- Header -->
  <div class="mb-6">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
      {title}
    </h2>

    <!-- View Controls -->
    <div class="flex gap-2 mb-4">
      {#if show_list}
        <button
          class="btn"
          class:btn-secondary={current_view === "list"}
          class:btn-outline={current_view !== "list"}
          on:click={show_list_view}
        >
          📋 List {formatted_entity_name}s
        </button>
      {/if}

      {#if show_create}
        <button
          class="btn"
          class:btn-secondary={current_view === "create"}
          class:btn-outline={current_view !== "create"}
          on:click={show_create_form}
        >
          ➕ Create {formatted_entity_name}
        </button>
      {/if}
    </div>
  </div>

  <!-- Content Area -->
  <div class="content-area">
    {#if current_view === "list"}
      <slot name="list" {show_edit_form} {show_create_form} />
    {:else if current_view === "create"}
      <slot name="create" {handle_entity_created} {show_list_view} />
    {:else if current_view === "edit"}
      <slot
        name="edit"
        {selected_entity}
        {handle_entity_updated}
        {show_list_view}
      />
    {/if}
  </div>
</div>

<style>
  .crud-container {
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    border: 1px solid rgb(229 231 235);
    padding: 1.5rem;
  }

  :global(.dark) .crud-container {
    background-color: rgb(31 41 55);
    border-color: rgb(55 65 81);
  }

  .content-area {
    min-height: 24rem;
  }
</style>
