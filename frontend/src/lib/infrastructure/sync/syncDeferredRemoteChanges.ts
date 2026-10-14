interface DeferredRemoteChanges {
  record(table_name: string, local_ids: readonly string[]): number;
  take(table_name: string, local_id: string): boolean;
  clear(): boolean;
}

const KEY_SEPARATOR = ":";

function build_deferral_key(table_name: string, local_id: string): string {
  return `${table_name}${KEY_SEPARATOR}${local_id}`;
}

function create_deferred_remote_changes(): DeferredRemoteChanges {
  const deferred_keys = new Set<string>();
  return {
    record: (table_name, local_ids) => {
      for (const local_id of local_ids)
        deferred_keys.add(build_deferral_key(table_name, local_id));
      return deferred_keys.size;
    },
    take: (table_name, local_id) =>
      deferred_keys.delete(build_deferral_key(table_name, local_id)),
    clear: () => {
      deferred_keys.clear();
      return true;
    },
  };
}

export const sync_deferred_remote_changes = create_deferred_remote_changes();
