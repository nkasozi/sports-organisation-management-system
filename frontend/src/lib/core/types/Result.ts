export type Result<TData, TError = string> =
  | { success: true; data: TData }
  | { success: false; error: TError };

export type AsyncResult<TData, TError = string> = Promise<
  Result<TData, TError>
>;

export interface PaginatedResult<TData> {
  items: TData[];
  total_count: number;
  page_number: number;
  page_size: number;
  total_pages: number;
}

export type PaginatedAsyncResult<TData, TError = string> = AsyncResult<
  PaginatedResult<TData>,
  TError
>;

export function create_success_result<TData>(
  data: TData,
): Result<TData, never> {
  return { success: true, data };
}

export function create_failure_result<TError = string>(
  error: TError,
): Result<never, TError> {
  return { success: false, error };
}

export function is_success<TData, TError>(
  result: Result<TData, TError>,
): result is { success: true; data: TData } {
  return result.success === true;
}

export function is_failure<TData, TError>(
  result: Result<TData, TError>,
): result is { success: false; error: TError } {
  return result.success === false;
}

export function map_result<TData, TNewData, TError>(
  result: Result<TData, TError>,
  transform_function: (data: TData) => TNewData,
): Result<TNewData, TError> {
  if (!result.success) {
    return result;
  }
  return create_success_result(transform_function(result.data));
}

export async function map_async_result<TData, TNewData, TError>(
  result_promise: AsyncResult<TData, TError>,
  transform_function: (data: TData) => TNewData,
): AsyncResult<TNewData, TError> {
  const result = await result_promise;
  return map_result(result, transform_function);
}
