<script lang="ts">
    import { AUDIT_ACTION, type AuditLog } from "$lib/core/entities/AuditLog";

    import { format_audit_log_change_lines } from "../../logic/auditLogPageState";
    import { AUDIT_LOG_MESSAGES } from "./auditLogMessages";

    export let log: AuditLog;

    const COLLAPSED_LINE_COUNT = 3;
    let is_expanded = false;

    $: change_lines = format_audit_log_change_lines(log);
    $: visible_lines = is_expanded
        ? change_lines
        : change_lines.slice(0, COLLAPSED_LINE_COUNT);
    $: hidden_count = change_lines.length - visible_lines.length;
</script>

{#if log.action === AUDIT_ACTION.CREATE}
    <div class="text-green-600 dark:text-green-400 font-medium">
        {AUDIT_LOG_MESSAGES.RECORD_CREATED}
    </div>
{:else if log.action === AUDIT_ACTION.DELETE}
    <div class="text-red-600 dark:text-red-400 font-medium">
        {AUDIT_LOG_MESSAGES.RECORD_DELETED}
    </div>
{/if}
{#if change_lines.length === 0 && log.action === AUDIT_ACTION.UPDATE}
    {AUDIT_LOG_MESSAGES.NO_CHANGES}
{/if}
<ul class="space-y-0.5">
    {#each visible_lines as line}
        <li class="break-words">{line}</li>
    {/each}
</ul>
{#if hidden_count > 0 || is_expanded}
    <button
        type="button"
        class="mt-1 text-xs text-primary-600 dark:text-primary-400 hover:underline"
        on:click={() => (is_expanded = !is_expanded)}
    >
        {is_expanded
            ? AUDIT_LOG_MESSAGES.SHOW_FEWER_CHANGES
            : `${AUDIT_LOG_MESSAGES.SHOW_ALL_CHANGES} (${change_lines.length})`}
    </button>
{/if}
