import type { PageLoad } from './$types';
import { getOrganizations } from '$lib/services/organizationService';
import { error } from '@sveltejs/kit';

/**
 * Loads the list of organizations for the page.
 * 
 * @param param0 - PageLoadEvent containing fetch
 * @returns An object containing the list of organizations or an error state.
 */
export const load: PageLoad = async ({ fetch }: { fetch: typeof globalThis.fetch }) => {
  // Ensure this only runs in the browser context if needed, or adjust based on SSR strategy
  // For simple data fetching for display, running on server/browser is fine.
  console.debug('Loading organizations...');

  // Inject fetch for potential testability or specific fetch configurations
  // Note: organizationService currently uses global fetch, consider injecting fetch if needed later.
  const response = await getOrganizations(); 

  if (response.success && response.data) {
    console.debug('Successfully loaded organizations:', response.data.length);
    return {
      organizations: response.data
    };
  } else {
    console.error('Failed to load organizations:', response.error);
    // Use SvelteKit's error helper for proper error page handling
    error(500, response.error || 'Failed to load organizations');
    // The line below is technically unreachable due to error() throwing, but satisfies TS
    // return { organizations: [], error: response.error || 'Failed to load organizations' }; 
  }
};
