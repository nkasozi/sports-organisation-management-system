<script lang="ts">
  import DynamicFormAlertCard from "./DynamicFormAlertCard.svelte";
  import DynamicFormTransferNotice from "./DynamicFormTransferNotice.svelte";

  export let color_clash_warnings: string[] = [];
  export let official_team_conflict_warnings: string[] = [];
  export let gender_mismatch_warnings: string[] = [];
  export let fixture_team_gender_mismatch_warnings: string[] = [];
  export let save_error_message: string = "";
  export let show_transfer_notice: boolean = false;
</script>

<div class="space-y-4">
  {#if color_clash_warnings.length > 0}
    <DynamicFormAlertCard
      tone="blue"
      icon="warning"
      title="Jersey Color Clash Detected"
      items={color_clash_warnings}
    />
  {/if}

  {#if official_team_conflict_warnings.length > 0}
    <DynamicFormAlertCard
      tone="red"
      icon="warning"
      title="Official-Team Conflict Detected"
      caption="The following officials have associations with teams playing in this fixture:"
      items={official_team_conflict_warnings}
    />
  {/if}

  {#if gender_mismatch_warnings.length > 0}
    <DynamicFormAlertCard
      tone="violet"
      icon="warning"
      title="Gender Mismatch Detected"
      items={gender_mismatch_warnings}
    />
  {/if}

  {#if fixture_team_gender_mismatch_warnings.length > 0}
    <DynamicFormAlertCard
      tone="violet"
      icon="warning"
      title="Team Gender Mismatch"
      items={fixture_team_gender_mismatch_warnings}
    />
  {/if}

  {#if show_transfer_notice}
    <DynamicFormTransferNotice />
  {/if}

  {#if save_error_message}
    <DynamicFormAlertCard
      tone="red"
      icon="error"
      message={save_error_message}
    />
  {/if}
</div>
