import {
  type AsyncResult,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

function save_record(): Result<boolean> {
  return create_success_result(true);
}

async function save_record_later(): AsyncResult<boolean> {
  return create_success_result(true);
}

function count_records(): number {
  return 1;
}

export async function ignores_results(): Promise<boolean> {
  save_record();
  await save_record_later();
  void save_record_later();
  return true;
}

export async function handles_results(): Promise<boolean> {
  const saved = save_record();
  const saved_later = await save_record_later();
  count_records();
  return saved.success && saved_later.success;
}
