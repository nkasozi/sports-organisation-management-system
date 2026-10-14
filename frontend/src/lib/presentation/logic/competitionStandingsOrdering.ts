export function compare_scores_descending(
  left: number[],
  right: number[],
): number {
  for (let index = 0; index < Math.max(left.length, right.length); index++) {
    const difference = (right[index] ?? 0) - (left[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

export function split_into_equal_runs<Entry>(
  sorted_entries: Entry[],
  are_equal: (left: Entry, right: Entry) => boolean,
): Entry[][] {
  return sorted_entries.reduce((runs: Entry[][], entry: Entry) => {
    const last_run = runs[runs.length - 1];
    if (last_run && are_equal(last_run[0], entry)) {
      last_run.push(entry);
      return runs;
    }
    runs.push([entry]);
    return runs;
  }, []);
}
