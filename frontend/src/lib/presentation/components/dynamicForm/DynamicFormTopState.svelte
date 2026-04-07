<script lang="ts">
  import DynamicFormAlertCard from "./DynamicFormAlertCard.svelte";

  export let auth_profile_missing: boolean = false;
  export let auth_error_message: string = "";
  export let has_entity_metadata: boolean = true;
  export let entity_type: string = "";
</script>

{#if auth_profile_missing}
  <DynamicFormAlertCard
    tone="secondary"
    icon="info"
    message={auth_error_message}
    show_accent_bar={true}
  />
{:else if !has_entity_metadata}
  <DynamicFormAlertCard
    tone="secondary"
    icon="info"
    message={`No metadata found for entity type "${entity_type}"`}
    show_accent_bar={true}
  />
{/if}
