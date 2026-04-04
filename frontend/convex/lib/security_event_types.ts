const SecurityEventType = {
  AUTH_FAILURE: "auth_failure",
  ACCESS_DENIED: "access_denied",
  ROLE_ESCALATION_BLOCKED: "role_escalation_blocked",
  INVALID_TABLE_ACCESS: "invalid_table_access",
  ORG_SCOPE_VIOLATION: "org_scope_violation",
  SYNC_MUTATION: "sync_mutation",
  SEED_ADMIN_BLOCKED: "seed_admin_blocked",
} as const;

export { SecurityEventType };
