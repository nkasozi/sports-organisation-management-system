import type { AuditLog } from "../../core/entities/AuditLog";
import type {
  EntityMetadata,
  FieldMetadata,
} from "../../core/entities/BaseEntity";
import type { ProfileLink } from "../../core/entities/ProfileLink";
import { PROFILE_LINK_PLATFORM_OPTIONS } from "../../core/entities/ProfileLink";

const PROFILELINK_PROFILE_ID_FIELD: FieldMetadata = {
  field_name: "profile_id" satisfies keyof ProfileLink,
  display_name: "Profile",
  field_type: "foreign_key",
  foreign_key_entity: "playerprofile",
  is_required: true,
  is_read_only: false,
  show_in_list: false,
};

const PROFILELINK_PLATFORM_FIELD: FieldMetadata = {
  field_name: "platform" satisfies keyof ProfileLink,
  display_name: "Platform",
  field_type: "enum",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
  enum_options: PROFILE_LINK_PLATFORM_OPTIONS,
};

const PROFILELINK_TITLE_FIELD: FieldMetadata = {
  field_name: "title" satisfies keyof ProfileLink,
  display_name: "Title",
  field_type: "string",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
  placeholder: "Link title or description",
};

const PROFILELINK_URL_FIELD: FieldMetadata = {
  field_name: "url" satisfies keyof ProfileLink,
  display_name: "URL",
  field_type: "string",
  is_required: true,
  is_read_only: false,
  show_in_list: true,
  placeholder: "https://...",
};

const PROFILELINK_DISPLAY_ORDER_FIELD: FieldMetadata = {
  field_name: "display_order" satisfies keyof ProfileLink,
  display_name: "Display Order",
  field_type: "number",
  is_required: false,
  is_read_only: false,
  show_in_list: false,
};

const PROFILELINK_STATUS_FIELD: FieldMetadata = {
  field_name: "status" satisfies keyof ProfileLink,
  display_name: "Status",
  field_type: "enum",
  is_required: true,
  is_read_only: false,
  enum_values: ["active", "inactive"],
  show_in_list: true,
};

const AUDITLOG_TIMESTAMP_FIELD: FieldMetadata = {
  field_name: "timestamp" satisfies keyof AuditLog,
  display_name: "Timestamp",
  field_type: "date",
  is_required: true,
  is_read_only: true,
  show_in_list: true,
};

const AUDITLOG_ENTITY_TYPE_FIELD: FieldMetadata = {
  field_name: "entity_type" satisfies keyof AuditLog,
  display_name: "Entity Type",
  field_type: "string",
  is_required: true,
  is_read_only: true,
  show_in_list: true,
};

const AUDITLOG_ENTITY_DISPLAY_NAME_FIELD: FieldMetadata = {
  field_name: "entity_display_name" satisfies keyof AuditLog,
  display_name: "Entity Name",
  field_type: "string",
  is_required: true,
  is_read_only: true,
  show_in_list: true,
};

const AUDITLOG_ACTION_FIELD: FieldMetadata = {
  field_name: "action" satisfies keyof AuditLog,
  display_name: "Action",
  field_type: "enum",
  is_required: true,
  is_read_only: true,
  enum_values: ["create", "update", "delete"],
  show_in_list: true,
};

const AUDITLOG_USER_DISPLAY_NAME_FIELD: FieldMetadata = {
  field_name: "user_display_name" satisfies keyof AuditLog,
  display_name: "User",
  field_type: "string",
  is_required: true,
  is_read_only: true,
  show_in_list: true,
};

const AUDITLOG_USER_EMAIL_FIELD: FieldMetadata = {
  field_name: "user_email" satisfies keyof AuditLog,
  display_name: "User Email",
  field_type: "string",
  is_required: true,
  is_read_only: true,
  show_in_list: false,
};

const AUDITLOG_ENTITY_ID_FIELD: FieldMetadata = {
  field_name: "entity_id" satisfies keyof AuditLog,
  display_name: "Entity ID",
  field_type: "string",
  is_required: true,
  is_read_only: true,
  show_in_list: false,
};

const AUDITLOG_USER_ID_FIELD: FieldMetadata = {
  field_name: "user_id" satisfies keyof AuditLog,
  display_name: "User ID",
  field_type: "string",
  is_required: true,
  is_read_only: true,
  show_in_list: false,
};

const AUDITLOG_IP_ADDRESS_FIELD: FieldMetadata = {
  field_name: "ip_address" satisfies keyof AuditLog,
  display_name: "IP Address",
  field_type: "string",
  is_required: false,
  is_read_only: true,
  show_in_list: false,
};

export function register_profile_link_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("profilelink", {
    entity_name: "profilelink",
    display_name: "Profile Link",
    fields: [
      PROFILELINK_PROFILE_ID_FIELD,
      PROFILELINK_PLATFORM_FIELD,
      PROFILELINK_TITLE_FIELD,
      PROFILELINK_URL_FIELD,
      PROFILELINK_DISPLAY_ORDER_FIELD,
      PROFILELINK_STATUS_FIELD,
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
      AUDITLOG_TIMESTAMP_FIELD,
      AUDITLOG_ENTITY_TYPE_FIELD,
      AUDITLOG_ENTITY_DISPLAY_NAME_FIELD,
      AUDITLOG_ACTION_FIELD,
      AUDITLOG_USER_DISPLAY_NAME_FIELD,
      AUDITLOG_USER_EMAIL_FIELD,
      AUDITLOG_ENTITY_ID_FIELD,
      AUDITLOG_USER_ID_FIELD,
      AUDITLOG_IP_ADDRESS_FIELD,
    ],
  });
  return metadata_map;
}
