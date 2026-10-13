export interface KeyedSerialExecutor {
  run<TValue>(key: string, task: () => Promise<TValue>): Promise<TValue>;
}

function settle_quietly(promise: Promise<unknown>): Promise<boolean> {
  return promise.then(
    () => true,
    () => false,
  );
}

export function create_keyed_serial_executor(): KeyedSerialExecutor {
  const tails = new Map<string, Promise<boolean>>();
  return {
    run<TValue>(key: string, task: () => Promise<TValue>): Promise<TValue> {
      const previous_tail = tails.get(key) ?? Promise.resolve(true);
      const result = previous_tail.then(task);
      const next_tail = settle_quietly(result);
      tails.set(key, next_tail);
      void next_tail.then(() => {
        if (tails.get(key) === next_tail) tails.delete(key);
      });
      return result;
    },
  };
}
