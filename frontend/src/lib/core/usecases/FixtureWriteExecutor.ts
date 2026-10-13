import { create_keyed_serial_executor } from "./KeyedSerialExecutor";

export const SHARED_FIXTURE_WRITE_EXECUTOR = create_keyed_serial_executor();
