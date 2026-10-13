type LocalChangeListener = (
  table_name: string,
  change_count: number,
) => boolean;

interface LocalChangeNotifier {
  set_listener(listener: LocalChangeListener): boolean;
  notify(table_name: string, change_count: number): boolean;
}

const IGNORE_LOCAL_CHANGES: LocalChangeListener = (): boolean => false;

function create_local_change_notifier(): LocalChangeNotifier {
  let current_listener = IGNORE_LOCAL_CHANGES;
  return {
    set_listener: (listener: LocalChangeListener): boolean => {
      current_listener = listener;
      return true;
    },
    notify: (table_name: string, change_count: number): boolean =>
      current_listener(table_name, change_count),
  };
}

export const sync_local_change_notifier = create_local_change_notifier();
