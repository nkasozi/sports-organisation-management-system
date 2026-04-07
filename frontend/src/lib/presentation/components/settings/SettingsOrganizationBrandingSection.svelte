<script lang="ts">
    import type { Organization } from "$lib/core/entities/Organization";
    import SettingsSectionCard from "$lib/presentation/components/settings/SettingsSectionCard.svelte";
    import ImageUpload from "$lib/presentation/components/ui/ImageUpload.svelte";

    export let default_logo_svg: string;
    export let organization_name: string;
    export let organization_logo_url: string;
    export let organization_tagline: string;
    export let organization_email: string;
    export let organization_address: string;
    export let is_super_admin: boolean;
    export let organizations: Organization[];
    export let selected_organization_id: string;
    export let is_platform_branding: boolean;
    export let organization_badge_label: string;
    export let on_organization_switch: () => Promise<boolean>;
    export let on_logo_change: (event: CustomEvent<{ url: string }>) => void;
    export let on_save: () => Promise<void>;
</script>

<SettingsSectionCard
    title="Organization Branding"
    description="Customize the appearance to match your organization"
>
    <svelte:fragment slot="header-actions">
        {#if is_super_admin && organizations.length > 0}
            <select
                class="input text-xs py-1 px-2 rounded-full"
                bind:value={selected_organization_id}
                on:change={() => void on_organization_switch()}
            >
                {#each organizations as organization (organization.id)}
                    <option value={organization.id}>{organization.name}</option>
                {/each}
            </select>
        {:else}
            <span
                class={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    is_platform_branding
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                }`}
            >
                {#if is_platform_branding}
                    <svg
                        class="w-3.5 h-3.5 mr-1.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        /></svg
                    >
                    Platform Default
                {:else}
                    <svg
                        class="w-3.5 h-3.5 mr-1.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        /></svg
                    >
                    {organization_badge_label}
                {/if}
            </span>
        {/if}
    </svelte:fragment>

    <div>
        <label
            for="org_name"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
        >
            Organization Name
        </label>
        <input
            id="org_name"
            type="text"
            class="input w-full max-w-md"
            bind:value={organization_name}
            placeholder="Enter organization name"
        />
    </div>

    <ImageUpload
        label="Organization Logo"
        current_image_url={organization_logo_url}
        default_image_url={default_logo_svg}
        max_size_mb={2}
        on:change={on_logo_change}
    />

    <div>
        <label
            for="org_tagline"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
        >
            Organization Tagline
        </label>
        <textarea
            id="org_tagline"
            class="input w-full max-w-md resize-none"
            rows="3"
            bind:value={organization_tagline}
            placeholder="Enter a short description for your organization"
        ></textarea>
        <p class="text-xs text-accent-500 dark:text-accent-400 mt-1">
            This appears on the dashboard and footer of your application
        </p>
    </div>

    <div>
        <label
            for="org_email"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
        >
            Contact Email
        </label>
        <input
            id="org_email"
            type="email"
            class="input w-full max-w-md"
            bind:value={organization_email}
            placeholder="contact@yourorganization.com"
        />
        <p class="text-xs text-accent-500 dark:text-accent-400 mt-1">
            Displayed on contact, privacy, and terms pages
        </p>
    </div>

    <div>
        <label
            for="org_address"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
        >
            Organization Address
        </label>
        <textarea
            id="org_address"
            class="input w-full max-w-md resize-none"
            rows="2"
            bind:value={organization_address}
            placeholder="123 Sports Avenue, Stadium City, SC 12345"
        ></textarea>
        <p class="text-xs text-accent-500 dark:text-accent-400 mt-1">
            Your organization's physical address for official correspondence
        </p>
    </div>

    <button type="button" class="btn btn-primary-action" on:click={on_save}>
        Save Branding
    </button>
</SettingsSectionCard>
