export function create_single_flight<T>(): (
  key: string,
  run: () => Promise<T>,
) => Promise<T> {
  const in_flight = new Map<string, Promise<T>>();
  return (key, run) => {
    const running = in_flight.get(key);
    if (running) return running;
    const started = run().finally(() => in_flight.delete(key));
    in_flight.set(key, started);
    return started;
  };
}
