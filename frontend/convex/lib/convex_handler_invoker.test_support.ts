import type { FakeConvexContext } from "./fake_convex_context.test_support";

const HANDLER_PROPERTY_NAME = "_handler";
const PUBLIC_FLAG_PROPERTY_NAME = "isPublic";
const INTERNAL_FLAG_PROPERTY_NAME = "isInternal";

export async function invoke_convex_handler<TResult>(
  registered_function: unknown,
  context: FakeConvexContext,
  function_arguments: Record<string, unknown>,
): Promise<TResult> {
  const handler = Reflect.get(
    registered_function as object,
    HANDLER_PROPERTY_NAME,
  ) as (
    handler_context: FakeConvexContext,
    handler_arguments: Record<string, unknown>,
  ) => Promise<TResult>;
  return handler(context, function_arguments);
}

export function get_registered_function_visibility(
  registered_function: unknown,
): { is_public: boolean; is_internal: boolean } {
  return {
    is_public:
      Reflect.get(registered_function as object, PUBLIC_FLAG_PROPERTY_NAME) ===
      true,
    is_internal:
      Reflect.get(
        registered_function as object,
        INTERNAL_FLAG_PROPERTY_NAME,
      ) === true,
  };
}
