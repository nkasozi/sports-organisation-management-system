let is_pulling_from_remote = false;

export function set_pulling_from_remote(value: boolean): void {
  is_pulling_from_remote = value;
}

export function get_pulling_from_remote(): boolean {
  return is_pulling_from_remote;
}
