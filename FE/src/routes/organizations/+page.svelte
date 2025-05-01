<script lang="ts">
  import type { PageData } from './$types';
  import { Button } from '$lib/components/ui/button'; // Assuming shadcn/ui button
  import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '$lib/components/ui/card'; // Assuming shadcn/ui card
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table'; // Assuming shadcn/ui table
  import { PlusCircle } from 'lucide-svelte'; // Icon library

  export let data: PageData;

  // Reactive declaration to access organizations from data
  $: organizations = data.organizations;

  // Helper function to format data (example)
  function formatType(type: string): string {
    if (!type) return 'N/A';
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  console.debug('Organization list page rendered with data:', organizations);

</script>

<div class="container mx-auto p-4 md:p-8">
  <Card class="w-full">
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
      <div>
        <CardTitle class="text-2xl font-bold tracking-tight">Organizations</CardTitle>
        <CardDescription class="text-muted-foreground">
          List of registered sports organizations.
        </CardDescription>
      </div>
      <a href="/organizations/create" data-sveltekit-preload-data="hover">
        <Button>
          <PlusCircle class="mr-2 h-4 w-4" /> Create New
        </Button>
      </a>
    </CardHeader>
    <CardContent>
      {#if organizations && organizations.length > 0}
        <div class="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-[100px]">ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead class="text-right">Actions</TableHead> 
              </TableRow>
            </TableHeader>
            <TableBody>
              {#each organizations as org (org.id)}
                <TableRow>
                  <TableCell class="font-medium">{org.id}</TableCell>
                  <TableCell>{org.attributes.name}</TableCell>
                  <TableCell>{formatType(org.attributes.type)}</TableCell>
                  <TableCell class="text-right">
                    <!-- Placeholder for View/Edit links -->
                     <a href="/organizations/{org.id}" class="text-blue-600 hover:underline" data-sveltekit-preload-data="hover">View</a>
                     <!-- <a href="/organizations/{org.id}/edit" class="ml-4 text-blue-600 hover:underline">Edit</a> -->
                  </TableCell>
                </TableRow>
              {/each}
            </TableBody>
          </Table>
        </div>
      {:else if !organizations}
       <!-- This case should ideally be handled by the error page via load function -->
        <p class="text-center text-red-500">Error loading organizations.</p>
      {:else}
        <p class="text-center text-muted-foreground">No organizations found.</p>
      {/if}
    </CardContent>
    <CardFooter>
      <div class="text-xs text-muted-foreground">
        Showing <strong>{organizations?.length || 0}</strong> organizations.
      </div>
    </CardFooter>
  </Card>
</div>

<style>
  /* Add any component-specific styles here if needed */
  /* Tailwind utility classes are used primarily */
</style>
