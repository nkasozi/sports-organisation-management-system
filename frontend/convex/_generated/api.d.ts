/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin_seed from "../admin_seed.js";
import type * as audit_logs from "../audit_logs.js";
import type * as authorization from "../authorization.js";
import type * as authorization_access_queries from "../authorization_access_queries.js";
import type * as authorization_helpers from "../authorization_helpers.js";
import type * as authorization_mutations from "../authorization_mutations.js";
import type * as authorization_navigation_queries from "../authorization_navigation_queries.js";
import type * as calendar_feed from "../calendar_feed.js";
import type * as crons from "../crons.js";
import type * as lib_access_review_visibility from "../lib/access_review_visibility.js";
import type * as lib_audit_entity_masking from "../lib/audit_entity_masking.js";
import type * as lib_audit_log_access from "../lib/audit_log_access.js";
import type * as lib_audit_log_search from "../lib/audit_log_search.js";
import type * as lib_auth_middleware from "../lib/auth_middleware.js";
import type * as lib_bootstrap_allowlist from "../lib/bootstrap_allowlist.js";
import type * as lib_bootstrap_gate from "../lib/bootstrap_gate.js";
import type * as lib_calendar_feed_scope from "../lib/calendar_feed_scope.js";
import type * as lib_calendar_token_lifetime from "../lib/calendar_token_lifetime.js";
import type * as lib_caller_ownership from "../lib/caller_ownership.js";
import type * as lib_caller_record_projection from "../lib/caller_record_projection.js";
import type * as lib_caller_scope from "../lib/caller_scope.js";
import type * as lib_cleared_fields from "../lib/cleared_fields.js";
import type * as lib_convex_errors from "../lib/convex_errors.js";
import type * as lib_dynamic_table_query from "../lib/dynamic_table_query.js";
import type * as lib_email_normalization from "../lib/email_normalization.js";
import type * as lib_log_masking from "../lib/log_masking.js";
import type * as lib_option from "../lib/option.js";
import type * as lib_ownership_refresh from "../lib/ownership_refresh.js";
import type * as lib_ownership_refresh_targets from "../lib/ownership_refresh_targets.js";
import type * as lib_ownership_touch from "../lib/ownership_touch.js";
import type * as lib_parent_organization_resolution from "../lib/parent_organization_resolution.js";
import type * as lib_parent_record_loading from "../lib/parent_record_loading.js";
import type * as lib_parent_reference_specs from "../lib/parent_reference_specs.js";
import type * as lib_parent_scoped_row_loader from "../lib/parent_scoped_row_loader.js";
import type * as lib_parent_scoped_write_ownership from "../lib/parent_scoped_write_ownership.js";
import type * as lib_parent_write_resolution from "../lib/parent_write_resolution.js";
import type * as lib_permission_checks from "../lib/permission_checks.js";
import type * as lib_public_read_support from "../lib/public_read_support.js";
import type * as lib_public_record_projection from "../lib/public_record_projection.js";
import type * as lib_record_absence from "../lib/record_absence.js";
import type * as lib_record_creator_stamp from "../lib/record_creator_stamp.js";
import type * as lib_record_organization from "../lib/record_organization.js";
import type * as lib_record_ownership from "../lib/record_ownership.js";
import type * as lib_record_page_reader from "../lib/record_page_reader.js";
import type * as lib_record_write_ownership from "../lib/record_write_ownership.js";
import type * as lib_record_write_ownership_types from "../lib/record_write_ownership_types.js";
import type * as lib_role_assignment_references from "../lib/role_assignment_references.js";
import type * as lib_role_read_policy from "../lib/role_read_policy.js";
import type * as lib_role_security from "../lib/role_security.js";
import type * as lib_scoped_record_reader from "../lib/scoped_record_reader.js";
import type * as lib_scoped_row_loader from "../lib/scoped_row_loader.js";
import type * as lib_scoped_write_guard from "../lib/scoped_write_guard.js";
import type * as lib_security_audit_scheduler from "../lib/security_audit_scheduler.js";
import type * as lib_security_event_types from "../lib/security_event_types.js";
import type * as lib_server_owned_fields from "../lib/server_owned_fields.js";
import type * as lib_super_admin_seed_access from "../lib/super_admin_seed_access.js";
import type * as lib_super_admin_seed_writer from "../lib/super_admin_seed_writer.js";
import type * as lib_sync_access_review_tombstones from "../lib/sync_access_review_tombstones.js";
import type * as lib_sync_admin_support from "../lib/sync_admin_support.js";
import type * as lib_sync_backfill_runner from "../lib/sync_backfill_runner.js";
import type * as lib_sync_backfill_state from "../lib/sync_backfill_state.js";
import type * as lib_sync_backfill_store from "../lib/sync_backfill_store.js";
import type * as lib_sync_batch_authorization from "../lib/sync_batch_authorization.js";
import type * as lib_sync_batch_record_follow_ups from "../lib/sync_batch_record_follow_ups.js";
import type * as lib_sync_batch_record_processor from "../lib/sync_batch_record_processor.js";
import type * as lib_sync_batch_record_types from "../lib/sync_batch_record_types.js";
import type * as lib_sync_batch_record_writer from "../lib/sync_batch_record_writer.js";
import type * as lib_sync_batch_scope_exit from "../lib/sync_batch_scope_exit.js";
import type * as lib_sync_change_feed from "../lib/sync_change_feed.js";
import type * as lib_sync_change_marker_scope from "../lib/sync_change_marker_scope.js";
import type * as lib_sync_change_markers from "../lib/sync_change_markers.js";
import type * as lib_sync_change_page_reader from "../lib/sync_change_page_reader.js";
import type * as lib_sync_change_stamp from "../lib/sync_change_stamp.js";
import type * as lib_sync_clear_job_machine from "../lib/sync_clear_job_machine.js";
import type * as lib_sync_clear_job_runner from "../lib/sync_clear_job_runner.js";
import type * as lib_sync_clear_job_store from "../lib/sync_clear_job_store.js";
import type * as lib_sync_clear_job_types from "../lib/sync_clear_job_types.js";
import type * as lib_sync_clear_page_loading from "../lib/sync_clear_page_loading.js";
import type * as lib_sync_clear_scope from "../lib/sync_clear_scope.js";
import type * as lib_sync_clear_table_order from "../lib/sync_clear_table_order.js";
import type * as lib_sync_guarded_delete from "../lib/sync_guarded_delete.js";
import type * as lib_sync_legacy_writes from "../lib/sync_legacy_writes.js";
import type * as lib_sync_metadata_projection from "../lib/sync_metadata_projection.js";
import type * as lib_sync_mutation_support from "../lib/sync_mutation_support.js";
import type * as lib_sync_read_authorization from "../lib/sync_read_authorization.js";
import type * as lib_sync_read_support from "../lib/sync_read_support.js";
import type * as lib_sync_record_store from "../lib/sync_record_store.js";
import type * as lib_sync_sequence_counter from "../lib/sync_sequence_counter.js";
import type * as lib_sync_table_catalog from "../lib/sync_table_catalog.js";
import type * as lib_sync_tombstone_retention from "../lib/sync_tombstone_retention.js";
import type * as lib_sync_tombstone_scope from "../lib/sync_tombstone_scope.js";
import type * as lib_sync_tombstone_scope_resolution from "../lib/sync_tombstone_scope_resolution.js";
import type * as lib_sync_tombstone_visibility from "../lib/sync_tombstone_visibility.js";
import type * as lib_sync_tombstones from "../lib/sync_tombstones.js";
import type * as lib_sync_validation from "../lib/sync_validation.js";
import type * as lib_sync_versioned_delete from "../lib/sync_versioned_delete.js";
import type * as lib_sync_versioning from "../lib/sync_versioning.js";
import type * as lib_sync_versioning_delete from "../lib/sync_versioning_delete.js";
import type * as lib_sync_write_decision from "../lib/sync_write_decision.js";
import type * as lib_sync_write_guard from "../lib/sync_write_guard.js";
import type * as lib_sync_write_pipeline from "../lib/sync_write_pipeline.js";
import type * as lib_system_user_change_policy from "../lib/system_user_change_policy.js";
import type * as lib_system_user_change_rules from "../lib/system_user_change_rules.js";
import type * as lib_system_user_change_types from "../lib/system_user_change_types.js";
import type * as lib_system_user_constants from "../lib/system_user_constants.js";
import type * as lib_system_user_lookup from "../lib/system_user_lookup.js";
import type * as lib_system_user_policy_context from "../lib/system_user_policy_context.js";
import type * as lib_system_user_write_guard from "../lib/system_user_write_guard.js";
import type * as lib_table_tenancy from "../lib/table_tenancy.js";
import type * as lib_team_manager_write_scope from "../lib/team_manager_write_scope.js";
import type * as lib_url_validation from "../lib/url_validation.js";
import type * as lib_user_role_change from "../lib/user_role_change.js";
import type * as lib_user_scope_filter from "../lib/user_scope_filter.js";
import type * as lib_value_guards from "../lib/value_guards.js";
import type * as lib_verification_reset from "../lib/verification_reset.js";
import type * as schema_admin_and_settings_tables from "../schema_admin_and_settings_tables.js";
import type * as schema_competition_tables from "../schema_competition_tables.js";
import type * as schema_game_and_admin_tables from "../schema_game_and_admin_tables.js";
import type * as schema_match_tables from "../schema_match_tables.js";
import type * as schema_profile_and_format_tables from "../schema_profile_and_format_tables.js";
import type * as schema_relation_tables from "../schema_relation_tables.js";
import type * as schema_staff_and_location_tables from "../schema_staff_and_location_tables.js";
import type * as schema_support_tables from "../schema_support_tables.js";
import type * as schema_sync_engine_tables from "../schema_sync_engine_tables.js";
import type * as schema_validators from "../schema_validators.js";
import type * as security_audit from "../security_audit.js";
import type * as seed_permissions from "../seed_permissions.js";
import type * as seed_permissions_builders from "../seed_permissions_builders.js";
import type * as seed_permissions_runtime from "../seed_permissions_runtime.js";
import type * as shared_entity_category_map from "../shared_entity_category_map.js";
import type * as shared_entity_role_grants from "../shared_entity_role_grants.js";
import type * as shared_entity_types from "../shared_entity_types.js";
import type * as shared_fixture_clock from "../shared_fixture_clock.js";
import type * as shared_own_record_permissions from "../shared_own_record_permissions.js";
import type * as shared_permission_definitions from "../shared_permission_definitions.js";
import type * as shared_record_ownership from "../shared_record_ownership.js";
import type * as shared_verification_policy from "../shared_verification_policy.js";
import type * as sidebar_icons from "../sidebar_icons.js";
import type * as sidebar_menu_seed_data from "../sidebar_menu_seed_data.js";
import type * as sidebar_menu_seed_data_primary from "../sidebar_menu_seed_data_primary.js";
import type * as sidebar_menu_seed_data_secondary from "../sidebar_menu_seed_data_secondary.js";
import type * as sync from "../sync.js";
import type * as sync_admin_mutations from "../sync_admin_mutations.js";
import type * as sync_basic_mutations from "../sync_basic_mutations.js";
import type * as sync_batch_delete_mutation from "../sync_batch_delete_mutation.js";
import type * as sync_batch_mutation from "../sync_batch_mutation.js";
import type * as sync_change_marker_queries from "../sync_change_marker_queries.js";
import type * as sync_change_queries from "../sync_change_queries.js";
import type * as sync_clear_jobs from "../sync_clear_jobs.js";
import type * as sync_demo_tables from "../sync_demo_tables.js";
import type * as sync_metadata_queries from "../sync_metadata_queries.js";
import type * as sync_read_queries from "../sync_read_queries.js";
import type * as sync_record_helpers from "../sync_record_helpers.js";
import type * as sync_record_page_queries from "../sync_record_page_queries.js";
import type * as sync_sequence_backfill from "../sync_sequence_backfill.js";
import type * as sync_tombstone_pruning from "../sync_tombstone_pruning.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin_seed: typeof admin_seed;
  audit_logs: typeof audit_logs;
  authorization: typeof authorization;
  authorization_access_queries: typeof authorization_access_queries;
  authorization_helpers: typeof authorization_helpers;
  authorization_mutations: typeof authorization_mutations;
  authorization_navigation_queries: typeof authorization_navigation_queries;
  calendar_feed: typeof calendar_feed;
  crons: typeof crons;
  "lib/access_review_visibility": typeof lib_access_review_visibility;
  "lib/audit_entity_masking": typeof lib_audit_entity_masking;
  "lib/audit_log_access": typeof lib_audit_log_access;
  "lib/audit_log_search": typeof lib_audit_log_search;
  "lib/auth_middleware": typeof lib_auth_middleware;
  "lib/bootstrap_allowlist": typeof lib_bootstrap_allowlist;
  "lib/bootstrap_gate": typeof lib_bootstrap_gate;
  "lib/calendar_feed_scope": typeof lib_calendar_feed_scope;
  "lib/calendar_token_lifetime": typeof lib_calendar_token_lifetime;
  "lib/caller_ownership": typeof lib_caller_ownership;
  "lib/caller_record_projection": typeof lib_caller_record_projection;
  "lib/caller_scope": typeof lib_caller_scope;
  "lib/cleared_fields": typeof lib_cleared_fields;
  "lib/convex_errors": typeof lib_convex_errors;
  "lib/dynamic_table_query": typeof lib_dynamic_table_query;
  "lib/email_normalization": typeof lib_email_normalization;
  "lib/log_masking": typeof lib_log_masking;
  "lib/option": typeof lib_option;
  "lib/ownership_refresh": typeof lib_ownership_refresh;
  "lib/ownership_refresh_targets": typeof lib_ownership_refresh_targets;
  "lib/ownership_touch": typeof lib_ownership_touch;
  "lib/parent_organization_resolution": typeof lib_parent_organization_resolution;
  "lib/parent_record_loading": typeof lib_parent_record_loading;
  "lib/parent_reference_specs": typeof lib_parent_reference_specs;
  "lib/parent_scoped_row_loader": typeof lib_parent_scoped_row_loader;
  "lib/parent_scoped_write_ownership": typeof lib_parent_scoped_write_ownership;
  "lib/parent_write_resolution": typeof lib_parent_write_resolution;
  "lib/permission_checks": typeof lib_permission_checks;
  "lib/public_read_support": typeof lib_public_read_support;
  "lib/public_record_projection": typeof lib_public_record_projection;
  "lib/record_absence": typeof lib_record_absence;
  "lib/record_creator_stamp": typeof lib_record_creator_stamp;
  "lib/record_organization": typeof lib_record_organization;
  "lib/record_ownership": typeof lib_record_ownership;
  "lib/record_page_reader": typeof lib_record_page_reader;
  "lib/record_write_ownership": typeof lib_record_write_ownership;
  "lib/record_write_ownership_types": typeof lib_record_write_ownership_types;
  "lib/role_assignment_references": typeof lib_role_assignment_references;
  "lib/role_read_policy": typeof lib_role_read_policy;
  "lib/role_security": typeof lib_role_security;
  "lib/scoped_record_reader": typeof lib_scoped_record_reader;
  "lib/scoped_row_loader": typeof lib_scoped_row_loader;
  "lib/scoped_write_guard": typeof lib_scoped_write_guard;
  "lib/security_audit_scheduler": typeof lib_security_audit_scheduler;
  "lib/security_event_types": typeof lib_security_event_types;
  "lib/server_owned_fields": typeof lib_server_owned_fields;
  "lib/super_admin_seed_access": typeof lib_super_admin_seed_access;
  "lib/super_admin_seed_writer": typeof lib_super_admin_seed_writer;
  "lib/sync_access_review_tombstones": typeof lib_sync_access_review_tombstones;
  "lib/sync_admin_support": typeof lib_sync_admin_support;
  "lib/sync_backfill_runner": typeof lib_sync_backfill_runner;
  "lib/sync_backfill_state": typeof lib_sync_backfill_state;
  "lib/sync_backfill_store": typeof lib_sync_backfill_store;
  "lib/sync_batch_authorization": typeof lib_sync_batch_authorization;
  "lib/sync_batch_record_follow_ups": typeof lib_sync_batch_record_follow_ups;
  "lib/sync_batch_record_processor": typeof lib_sync_batch_record_processor;
  "lib/sync_batch_record_types": typeof lib_sync_batch_record_types;
  "lib/sync_batch_record_writer": typeof lib_sync_batch_record_writer;
  "lib/sync_batch_scope_exit": typeof lib_sync_batch_scope_exit;
  "lib/sync_change_feed": typeof lib_sync_change_feed;
  "lib/sync_change_marker_scope": typeof lib_sync_change_marker_scope;
  "lib/sync_change_markers": typeof lib_sync_change_markers;
  "lib/sync_change_page_reader": typeof lib_sync_change_page_reader;
  "lib/sync_change_stamp": typeof lib_sync_change_stamp;
  "lib/sync_clear_job_machine": typeof lib_sync_clear_job_machine;
  "lib/sync_clear_job_runner": typeof lib_sync_clear_job_runner;
  "lib/sync_clear_job_store": typeof lib_sync_clear_job_store;
  "lib/sync_clear_job_types": typeof lib_sync_clear_job_types;
  "lib/sync_clear_page_loading": typeof lib_sync_clear_page_loading;
  "lib/sync_clear_scope": typeof lib_sync_clear_scope;
  "lib/sync_clear_table_order": typeof lib_sync_clear_table_order;
  "lib/sync_guarded_delete": typeof lib_sync_guarded_delete;
  "lib/sync_legacy_writes": typeof lib_sync_legacy_writes;
  "lib/sync_metadata_projection": typeof lib_sync_metadata_projection;
  "lib/sync_mutation_support": typeof lib_sync_mutation_support;
  "lib/sync_read_authorization": typeof lib_sync_read_authorization;
  "lib/sync_read_support": typeof lib_sync_read_support;
  "lib/sync_record_store": typeof lib_sync_record_store;
  "lib/sync_sequence_counter": typeof lib_sync_sequence_counter;
  "lib/sync_table_catalog": typeof lib_sync_table_catalog;
  "lib/sync_tombstone_retention": typeof lib_sync_tombstone_retention;
  "lib/sync_tombstone_scope": typeof lib_sync_tombstone_scope;
  "lib/sync_tombstone_scope_resolution": typeof lib_sync_tombstone_scope_resolution;
  "lib/sync_tombstone_visibility": typeof lib_sync_tombstone_visibility;
  "lib/sync_tombstones": typeof lib_sync_tombstones;
  "lib/sync_validation": typeof lib_sync_validation;
  "lib/sync_versioned_delete": typeof lib_sync_versioned_delete;
  "lib/sync_versioning": typeof lib_sync_versioning;
  "lib/sync_versioning_delete": typeof lib_sync_versioning_delete;
  "lib/sync_write_decision": typeof lib_sync_write_decision;
  "lib/sync_write_guard": typeof lib_sync_write_guard;
  "lib/sync_write_pipeline": typeof lib_sync_write_pipeline;
  "lib/system_user_change_policy": typeof lib_system_user_change_policy;
  "lib/system_user_change_rules": typeof lib_system_user_change_rules;
  "lib/system_user_change_types": typeof lib_system_user_change_types;
  "lib/system_user_constants": typeof lib_system_user_constants;
  "lib/system_user_lookup": typeof lib_system_user_lookup;
  "lib/system_user_policy_context": typeof lib_system_user_policy_context;
  "lib/system_user_write_guard": typeof lib_system_user_write_guard;
  "lib/table_tenancy": typeof lib_table_tenancy;
  "lib/team_manager_write_scope": typeof lib_team_manager_write_scope;
  "lib/url_validation": typeof lib_url_validation;
  "lib/user_role_change": typeof lib_user_role_change;
  "lib/user_scope_filter": typeof lib_user_scope_filter;
  "lib/value_guards": typeof lib_value_guards;
  "lib/verification_reset": typeof lib_verification_reset;
  schema_admin_and_settings_tables: typeof schema_admin_and_settings_tables;
  schema_competition_tables: typeof schema_competition_tables;
  schema_game_and_admin_tables: typeof schema_game_and_admin_tables;
  schema_match_tables: typeof schema_match_tables;
  schema_profile_and_format_tables: typeof schema_profile_and_format_tables;
  schema_relation_tables: typeof schema_relation_tables;
  schema_staff_and_location_tables: typeof schema_staff_and_location_tables;
  schema_support_tables: typeof schema_support_tables;
  schema_sync_engine_tables: typeof schema_sync_engine_tables;
  schema_validators: typeof schema_validators;
  security_audit: typeof security_audit;
  seed_permissions: typeof seed_permissions;
  seed_permissions_builders: typeof seed_permissions_builders;
  seed_permissions_runtime: typeof seed_permissions_runtime;
  shared_entity_category_map: typeof shared_entity_category_map;
  shared_entity_role_grants: typeof shared_entity_role_grants;
  shared_entity_types: typeof shared_entity_types;
  shared_fixture_clock: typeof shared_fixture_clock;
  shared_own_record_permissions: typeof shared_own_record_permissions;
  shared_permission_definitions: typeof shared_permission_definitions;
  shared_record_ownership: typeof shared_record_ownership;
  shared_verification_policy: typeof shared_verification_policy;
  sidebar_icons: typeof sidebar_icons;
  sidebar_menu_seed_data: typeof sidebar_menu_seed_data;
  sidebar_menu_seed_data_primary: typeof sidebar_menu_seed_data_primary;
  sidebar_menu_seed_data_secondary: typeof sidebar_menu_seed_data_secondary;
  sync: typeof sync;
  sync_admin_mutations: typeof sync_admin_mutations;
  sync_basic_mutations: typeof sync_basic_mutations;
  sync_batch_delete_mutation: typeof sync_batch_delete_mutation;
  sync_batch_mutation: typeof sync_batch_mutation;
  sync_change_marker_queries: typeof sync_change_marker_queries;
  sync_change_queries: typeof sync_change_queries;
  sync_clear_jobs: typeof sync_clear_jobs;
  sync_demo_tables: typeof sync_demo_tables;
  sync_metadata_queries: typeof sync_metadata_queries;
  sync_read_queries: typeof sync_read_queries;
  sync_record_helpers: typeof sync_record_helpers;
  sync_record_page_queries: typeof sync_record_page_queries;
  sync_sequence_backfill: typeof sync_sequence_backfill;
  sync_tombstone_pruning: typeof sync_tombstone_pruning;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
