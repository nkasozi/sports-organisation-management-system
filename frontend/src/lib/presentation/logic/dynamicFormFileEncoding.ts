import type { AsyncResult } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  DYNAMIC_FORM_EVENT,
  DYNAMIC_FORM_MESSAGE,
} from "./dynamicFormMessages";
import { is_string_value } from "./runtimeTypeGuards";

export function convert_file_to_base64(file: File): AsyncResult<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (): void => {
      const encoded_value = reader.result;
      if (is_string_value(encoded_value)) {
        resolve(create_success_result(encoded_value));
        return;
      }
      console.error("[DynamicForm] File read produced no text", {
        event: DYNAMIC_FORM_EVENT.FILE_READ_FAILED,
        file_size: file.size,
      });
      resolve(
        create_failure_result(DYNAMIC_FORM_MESSAGE.FILE_PROCESSING_FAILED),
      );
    };
    reader.onerror = (): void => {
      console.error("[DynamicForm] Failed to read file", {
        event: DYNAMIC_FORM_EVENT.FILE_READ_FAILED,
        file_size: file.size,
        error: String(reader.error),
      });
      resolve(
        create_failure_result(DYNAMIC_FORM_MESSAGE.FILE_PROCESSING_FAILED),
      );
    };
    reader.readAsDataURL(file);
  });
}
