<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import LiveGameManagement from '$lib/presentation/components/LiveGameManagement.svelte';
  import type { Fixture } from '$lib/core/entities/Fixture';
  import { get_fixture_use_cases } from '$lib/core/usecases/FixtureUseCases';

  const fixture_use_cases = get_fixture_use_cases();

  let fixture: Fixture | null = null;
  let is_loading = true;
  let error_message = '';

  onMount(async () => {
    if (!browser) return;
    fixture = await load_fixture();
    is_loading = false;
  });

  async function load_fixture(): Promise<Fixture | null> {
    const fixture_id = $page.params.id;

    if (!fixture_id) {
      error_message = 'No fixture ID provided';
      return null;
    }

    const result = await fixture_use_cases.get_by_id(fixture_id);

    if (!result.success || !result.data) {
      error_message = result.error_message || 'Failed to load fixture';
      return null;
    }

    if (result.data.status === 'completed' || result.data.status === 'cancelled') {
      error_message = 'This fixture has already been completed or cancelled';
      return null;
    }

    return result.data;
  }
</script>

<div class="container mx-auto px-4 py-8">
  {#if is_loading}
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  {:else if error_message}
    <div class="bg-red-50 border border-red-200 rounded-lg p-6">
      <h2 class="text-lg font-semibold text-red-800 mb-2">Error</h2>
      <p class="text-red-600">{error_message}</p>
      <a href="/live-games" class="mt-4 inline-block text-blue-600 hover:text-blue-800 underline">
        Back to Live Games
      </a>
    </div>
  {:else if fixture}
    <LiveGameManagement />
  {/if}
</div>
