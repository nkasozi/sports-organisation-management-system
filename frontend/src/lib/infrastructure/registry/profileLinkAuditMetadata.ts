import type { AuditLog } from "../../core/entities/AuditLog";
import type { EntityMetadata } from "../../core/entities/BaseEntity";
import type { ProfileLink } from "../../core/entities/ProfileLink";
import { PROFILE_LINK_PLATFORM_OPTIONS } from "../../core/entities/ProfileLink";

export function register_profile_link_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("profilelink", {
    entity_name: "profilelink",
    display_name: "Profile Link",
    fields: [
      {
        field_name: "profile_id" satisfies keyof ProfileLink,
        display_name: "Profile",
        field_type: "foreign_key",
        foreign_key_entity: "playerprofile",
        is_required: true,
        is_read_only: false,
        show_in_list: false,
      },
      {
        field_name: "platform" satisfies keyof ProfileLink,
        display_name: "Platform",
        field_type: "enum",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
        enum_options: PROFILE_LINK_PLATFORM_OPTIONS,
      },
      {
        field_name: "title" satisfies keyof ProfileLink,
        display_name: "Title",
        field_type: "string",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
        placeholder: "Link title or description",
      },
      {
        field_name: "url" satisfies keyof ProfileLink,
        display_name: "URL",
        field_type: "string",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
        placeholder: "https://...",
      },
      {
        field_name: "display_order" satisfies keyof ProfileLink,
        display_name: "Display Order",
        field_type: "number",
        is_required: false,
        is_read_only: false,
        show_in_list: false,
      },
      {
        field_name: "status" satisfies keyof ProfileLink,
        display_name: "Status",
        field_type: "enum",
        is_required: true,
        is_read_only: false,
        enum_values: ["active", "inactive"],
        show_in_list: true,
      },
    ],
  });
  return metadata_map;
}

export function register_audit_log_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("auditlog", {
    entity_name: "auditlog",
    display_name: "Audit Log",
    fields: [
      {
        field_name: "timestamp" satisfies keyof AuditLog,
        display_name: "Timestamp",
        field_type: "date",
        is_required: true,
        is_read_only: true,
        show_in_list: true,
      },
      {
        field_name: "entity_type" satisfies keyof AuditLog,
        display_name: "Entity Type",
        field_type: "string",
        is_required: true,
        is_read_only: true,
        show_in_list: true,
      },
      {
        field_name: "entity_display_name" satisfies keyof AuditLog,
        display_name: "Entity Name",
        field_type: "string",
        is_required: true,
        is_read_only: true,
        show_in_list: true,
      },
      {
        field_name: "action" satisfies keyof AuditLog,
        display_name: "Action",
        field_type: "enum",
        is_required: true,
        is_read_only: true,
        enum_values: ["create", "update", "delete"],
        show_in_list: true,
      },
      {
        field_name: "user_display_name" satisfies keyof AuditLog,
        display_name: "User",
        field_type: "string",
        is_required: true,
        is_read_only: true,
        show_in_list: true,
      },
      {
        field_name: "user_email" satisfies keyof AuditLog,
        display_name: "User Email",
        field_type: "string",
        is_required: true,
        is_read_only: true,
        show_in_list: false,
      },
      {
        field_name: "entity_id" satisfies keyof AuditLog,
        display_name: "Entity ID",
        field_type: "string",
        is_required: true,
        is_read_only: true,
        show_in_list: false,
      },
      {
        field_name: "user_id" satisfies keyof AuditLog,
        display_name: "User ID",
        field_type: "string",
        is_required: true,
        is_read_only: true,
        show_in_list: false,
      },
      {
        field_name: "ip_address" satisfies keyof AuditLog,
        display_name: "IP Address",
        field_type: "string",
        is_required: false,
        is_read_only: true,
        show_in_list: false,
      },
    ],
  });
  return metadata_map;
}
