import Dexie from "dexie";
import { IDBKeyRange, indexedDB } from "fake-indexeddb";
import { expect } from "vitest";

import {
  create_none_option,
  create_some_option,
  type Option,
} from "$lib/core/types/Option";
import type { AsyncResult } from "$lib/core/types/Result";

import {
  create_local_unlock_session_storage,
  type LocalUnlockSessionStorage,
} from "./localUnlockSessionStorage";
import type {
  LocalDataKeyHolder,
  LocalVaultService,
} from "./localVaultContracts";
import { create_local_vault_database } from "./localVaultDatabase";
import { create_local_vault_service } from "./localVaultService";
import {
  create_local_vault_storage,
  type LocalVaultStorage,
} from "./localVaultStorage";
import {
  create_fake_passkey_device,
  type FakePasskeyDevice,
  type FakePasskeyDeviceConfig,
} from "./passkeyPrf.test_support";
import { create_passkey_prf_authenticator } from "./passkeyPrfAuthenticator";

Dexie.dependencies.indexedDB = indexedDB;
Dexie.dependencies.IDBKeyRange = IDBKeyRange;

export const TEST_PIN_ITERATIONS = 1000;
export const TEST_NOW = new Date("2026-10-19T08:00:00.000Z");

export interface LocalVaultTestClock {
  now: Date;
}

export interface LocalVaultTestHarness {
  service: LocalVaultService;
  storage: LocalVaultStorage;
  unlock_session_storage: LocalUnlockSessionStorage;
  clock: LocalVaultTestClock;
  announced_session_endings: string[];
  key_holder: LocalDataKeyHolder;
  device: FakePasskeyDevice;
  database_name: string;
}

function create_test_key_holder(): LocalDataKeyHolder {
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

export function create_local_vault_test_harness(
  device_config: Partial<FakePasskeyDeviceConfig> = {},
  database_name: string = `vault_service_test_${crypto.randomUUID()}`,
  clock: LocalVaultTestClock = { now: TEST_NOW },
): LocalVaultTestHarness {
  const database = create_local_vault_database(database_name);
  const storage = create_local_vault_storage(database);
  const unlock_session_storage = create_local_unlock_session_storage(database);
  const announced_session_endings: string[] = [];
  const key_holder = create_test_key_holder();
  const device = create_fake_passkey_device(device_config);
  const service = create_local_vault_service({
    storage,
    unlock_session_storage,
    announce_unlock_session_ended: () => {
      announced_session_endings.push(clock.now.toISOString());
      return true;
    },
    key_holder,
    passkey_authenticator: create_passkey_prf_authenticator(() =>
      create_some_option({
        credentials: device.credentials,
        capability_checks: {
          is_platform_authenticator_available: async () => true,
          read_client_capabilities: async () => ({}),
        },
      }),
    ),
    read_relying_party_id: () => "localhost",
    read_current_time: () => clock.now,
    pin_iterations: TEST_PIN_ITERATIONS,
  });
  return {
    service,
    storage,
    unlock_session_storage,
    clock,
    announced_session_endings,
    key_holder,
    device,
    database_name,
  };
}

export async function expect_success<T>(pending: AsyncResult<T>): Promise<T> {
  const result = await pending;
  if (!result.success) return expect.unreachable(result.error);
  return result.data;
}
