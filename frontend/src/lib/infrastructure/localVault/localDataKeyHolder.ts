import {
  create_none_option,
  create_some_option,
  type Option,
} from "$lib/core/types/Option";

import type { LocalDataKeyHolder } from "./localVaultContracts";

function create_local_data_key_holder(): LocalDataKeyHolder {
  let data_key: Option<Uint8Array> = create_none_option();
  return {
    current: () => data_key,
    remember: (key: Uint8Array) => {
      data_key = create_some_option(key);
    },
    forget: () => {
      data_key = create_none_option();
    },
  };
}

export const local_data_key_holder = create_local_data_key_holder();
