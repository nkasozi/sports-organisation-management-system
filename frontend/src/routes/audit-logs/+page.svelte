<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";

  import { browser } from "$app/environment";
  import { page } from "$app/stores";
  import type { AuditLog } from "$lib/core/entities/AuditLog";
  import { type UserScopeProfile } from "$lib/core/interfaces/ports";
  import { get_audit_log_use_cases } from "$lib/infrastructure/registry/useCaseFactories";
  import { AUDIT_LOG_PAGE_SIZE } from "$lib/infrastructure/sync/convexAuditLogService";
  import AuditLogFilters from "$lib/presentation/components/audit/AuditLogFilters.svelte";
  import AuditLogTable from "$lib/presentation/components/audit/AuditLogTable.svelte";
  import {
    ensure_auth_profile,
    ensure_route_access,
  } from "$lib/presentation/logic/authGuard";
  import { auth_store } from "$lib/presentation/stores/auth";

  import {
    build_audit_log_filter,
    get_audit_log_organization_filter,
  } from "../../lib/presentation/logic/auditLogPageState";

  let audit_logs: AuditLog[] = [];
  let is_loading = true,
    error_message = "",
    total_count = 0,
    current_page = 1;
  let page_size = AUDIT_LOG_PAGE_SIZE,
    filter_entity_type = "",
    filter_action = "";

  const audit_log_use_cases = get_audit_log_use_cases();

  function get_organization_filter(): string | null {
    return get_audit_log_organization_filter(
      get(auth_store).current_profile as UserScopeProfile | null,
    );
  }

  async function load_audit_logs(): Promise<AuditLog[]> {
    if (!browser) return [];

    is_loading = true;
    error_message = "";
    const filter = build_audit_log_filter({
      filter_entity_type,
      filter_action,
      filter_user: "",
      organization_id: get_organization_filter(),
    });

    const result = await audit_log_use_cases.list(filter, {
      page_number: current_page,
      page_size: page_size,
    });

    is_loading = false;

    if (!result.success) {
      error_message = result.error || "Failed to load audit logs";
      return [];
    }

    total_count = result.data?.total_count || 0;
    return result.data?.items || [];
  }

  async function handle_filter_change(): Promise<void> {
    current_page = 1;
    audit_logs = await load_audit_logs();
  }

  async function handle_page_change(new_page: number): Promise<void> {
    current_page = new_page;
    audit_logs = await load_audit_logs();
  }

  onMount(async () => {
    if (!browser) return;

    const route_allowed = await ensure_route_access($page.url.pathname);
    if (!route_allowed) return;

    const auth_result = await ensure_auth_profile();
    if (!auth_result.success) {
      error_message = auth_result.error_message;
      is_loading = false;
      return;
    }

    audit_logs = await load_audit_logs();
  });
</script>

<svelte:head>
  <title>Audit Trail - Sports Management</title>
</svelte:head>

<div class="container mx-auto px-4 py-6">
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
      Audit Trail
    </h1>
    <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
      View all changes made to entities in the system
    </p>
  </div>

  <AuditLogFilters
    bind:filter_entity_type
    bind:filter_action
    on_filters_changed={handle_filter_change}
  />
  <AuditLogTable
    {audit_logs}
    {is_loading}
    {error_message}
    {total_count}
    {current_page}
    {page_size}
    on_page_change={handle_page_change}
  />
</div>
