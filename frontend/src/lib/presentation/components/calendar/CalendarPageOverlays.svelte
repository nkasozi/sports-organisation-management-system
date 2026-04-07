<script lang="ts">
    import type { Activity } from "$lib/core/entities/Activity";
    import type { ActivityCategory } from "$lib/core/entities/ActivityCategory";
    import type { CalendarEvent } from "$lib/core/interfaces/ports/internal/usecases/ActivityUseCasesPort";
    import Toast from "$lib/presentation/components/ui/Toast.svelte";
    import type { ActivityFormValues } from "$lib/presentation/logic/calendarPageState";

    import CalendarActivityFormModal from "./CalendarActivityFormModal.svelte";
    import CalendarCategoryModal from "./CalendarCategoryModal.svelte";
    import CalendarEventDetailsModal from "./CalendarEventDetailsModal.svelte";
    import CalendarSubscribeModal from "./CalendarSubscribeModal.svelte";

    export let activity_form_values: ActivityFormValues;
    export let show_create_modal: boolean;
    export let editing_activity: Activity | null;
    export let categories: ActivityCategory[];
    export let selected_event_details: CalendarEvent | null;
    export let show_category_modal: boolean;
    export let show_subscribe_modal: boolean;
    export let selected_organization_id: string;
    export let toast_visible: boolean;
    export let toast_message: string;
    export let toast_type: "success" | "error" | "warning" | "info";
    export let on_close_create_modal: () => void;
    export let on_save_activity: () => Promise<void>;
    export let on_delete_activity: () => Promise<void>;
    export let on_close_event_details_modal: () => void;
    export let on_close_category_modal: () => void;
    export let on_create_category: (
        category_name: string,
        category_color: string,
        category_type: string,
    ) => Promise<void>;
    export let on_close_subscribe_modal: () => void;
</script>

<CalendarActivityFormModal
    bind:activity_form_values
    is_visible={show_create_modal}
    {editing_activity}
    {categories}
    on_close={on_close_create_modal}
    on_save={on_save_activity}
    on_delete={on_delete_activity}
/>
<CalendarEventDetailsModal
    {selected_event_details}
    on_close={on_close_event_details_modal}
/>
<CalendarCategoryModal
    is_visible={show_category_modal}
    on_close={on_close_category_modal}
    on_create={on_create_category}
/>
<CalendarSubscribeModal
    is_visible={show_subscribe_modal}
    organization_id={selected_organization_id}
    on_close={on_close_subscribe_modal}
/>
<Toast
    bind:is_visible={toast_visible}
    message={toast_message}
    type={toast_type}
    on:dismiss={() => (toast_visible = false)}
/>
