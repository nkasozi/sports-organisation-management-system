<script lang="ts">
    import type { CreateSportInput } from "$lib/core/entities/Sport";
    import EnumSelectField from "$lib/presentation/components/ui/EnumSelectField.svelte";
    import FormField from "$lib/presentation/components/ui/FormField.svelte";
    import { SPORT_STATUS_OPTIONS } from "$lib/presentation/logic/sportFormEditorState";

    export let form_data: CreateSportInput;
    export let errors: Record<string, string>;
</script>

<div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
            label="Sport Name"
            name="name"
            bind:value={form_data.name}
            placeholder="e.g., Football, Basketball"
            required={true}
            error={errors.name || ""}
        />
        <FormField
            label="Code"
            name="code"
            bind:value={form_data.code}
            placeholder="e.g., FOOTBALL, BASKETBALL"
            required={true}
            error={errors.code || ""}
        />
        <div class="md:col-span-2">
            <FormField
                label="Description"
                name="description"
                bind:value={form_data.description}
                placeholder="Brief description of the sport"
            />
        </div>
        <FormField
            label="Icon (Emoji)"
            name="icon_url"
            bind:value={form_data.icon_url}
            placeholder="e.g., soccer"
        />
        <EnumSelectField
            label="Status"
            name="status"
            bind:value={form_data.status}
            options={SPORT_STATUS_OPTIONS}
            error={errors.status || ""}
        />
        <FormField
            label="Standard Game Duration (minutes)"
            name="standard_game_duration_minutes"
            type="number"
            bind:value={form_data.standard_game_duration_minutes}
            required={true}
        />
        <FormField
            label="Max Players on Field"
            name="max_players_on_field"
            type="number"
            bind:value={form_data.max_players_on_field}
            required={true}
        />
        <FormField
            label="Min Players on Field"
            name="min_players_on_field"
            type="number"
            bind:value={form_data.min_players_on_field}
            required={true}
        />
        <FormField
            label="Max Squad Size"
            name="max_squad_size"
            type="number"
            bind:value={form_data.max_squad_size}
            required={true}
        />
    </div>
</div>
