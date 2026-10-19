import Dexie from "dexie";

import { local_data_key_holder } from "$lib/infrastructure/localVault/localDataKeyHolder";

const TEST_LOCAL_DATA_KEY_BYTE = 42;
const TEST_LOCAL_DATA_KEY_LENGTH = 32;

function create_test_local_data_key(): Uint8Array {
  return new Uint8Array(TEST_LOCAL_DATA_KEY_LENGTH).fill(
    TEST_LOCAL_DATA_KEY_BYTE,
  );
}

export function remember_test_local_data_key(): boolean {
  local_data_key_holder.remember(create_test_local_data_key());
  return true;
}

export async function open_raw_test_database(
  database_name: string,
): Promise<Dexie> {
  const raw_database = new Dexie(database_name);
  await raw_database.open();
  return raw_database;
}
