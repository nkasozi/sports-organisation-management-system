<script lang="ts">
    import {
        create_empty_contact_message_form_values,
        create_idle_contact_message_submission_state,
        resolve_contact_message_field_errors,
        submit_contact_message_form,
    } from "$lib/presentation/logic/contactMessageForm";
    import {
        CONTACT_MESSAGE_SUBMISSION_STATUS,
        type ContactMessageFormValues,
        type ContactMessageSubmissionState,
    } from "$lib/presentation/logic/contactMessageFormTypes";

    export let recipient_email: string;

    let form_values: ContactMessageFormValues =
        create_empty_contact_message_form_values();
    let submission_state: ContactMessageSubmissionState =
        create_idle_contact_message_submission_state();

    $: field_errors = resolve_contact_message_field_errors(submission_state);

    function open_mail_link(mailto_link: string): boolean {
        window.location.href = mailto_link;
        return true;
    }

    function handle_submit(): void {
        submission_state = submit_contact_message_form({
            values: form_values,
            recipient_email,
            open_mail_link,
        });
    }
</script>

<form class="space-y-4" novalidate on:submit|preventDefault={handle_submit}>
    <div>
        <label
            for="name"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
        >
            Name
        </label>
        <input
            id="name"
            type="text"
            class="input"
            placeholder="Your name"
            bind:value={form_values.name}
            aria-invalid={field_errors.name.length > 0}
        />
        {#if field_errors.name}
            <p class="mt-1 text-sm text-red-600 dark:text-red-400">
                {field_errors.name}
            </p>
        {/if}
    </div>

    <div>
        <label
            for="email"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
        >
            Email
        </label>
        <input
            id="email"
            type="email"
            class="input"
            placeholder="your@email.com"
            bind:value={form_values.email}
            aria-invalid={field_errors.email.length > 0}
        />
        {#if field_errors.email}
            <p class="mt-1 text-sm text-red-600 dark:text-red-400">
                {field_errors.email}
            </p>
        {/if}
    </div>

    <div>
        <label
            for="subject"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
        >
            Subject
        </label>
        <input
            id="subject"
            type="text"
            class="input"
            placeholder="How can we help?"
            bind:value={form_values.subject}
        />
    </div>

    <div>
        <label
            for="message"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
        >
            Message
        </label>
        <textarea
            id="message"
            class="input min-h-32"
            placeholder="Your message..."
            bind:value={form_values.message}
            aria-invalid={field_errors.message.length > 0}
        ></textarea>
        {#if field_errors.message}
            <p class="mt-1 text-sm text-red-600 dark:text-red-400">
                {field_errors.message}
            </p>
        {/if}
    </div>

    <button type="submit" class="btn btn-primary-action w-full">
        Send Message
    </button>

    {#if submission_state.status === CONTACT_MESSAGE_SUBMISSION_STATUS.OPENED}
        <p
            class="text-sm text-green-700 dark:text-green-400"
            role="status"
            aria-live="polite"
        >
            {submission_state.message}
        </p>
    {:else if submission_state.status === CONTACT_MESSAGE_SUBMISSION_STATUS.FAILED}
        <p class="text-sm text-red-600 dark:text-red-400" role="alert">
            {submission_state.message}
        </p>
    {/if}
</form>
