import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "$lib/core/types/Option";

const LOCAL_UNLOCK_SESSION_CHANNEL_NAME = "sport-sync-local-unlock-session";
const LOCAL_UNLOCK_SESSION_ENDED_MESSAGE = "local_unlock_session_ended";
const BROADCAST_CHANNEL_GLOBAL_NAME = "BroadcastChannel";
const MESSAGE_EVENT_NAME = "message";
const CHANNEL_UNAVAILABLE_EVENT = "local_unlock_session_channel_unavailable";

function open_unlock_session_channel(): Option<BroadcastChannel> {
  if (BROADCAST_CHANNEL_GLOBAL_NAME in globalThis)
    return create_some_option(
      new BroadcastChannel(LOCAL_UNLOCK_SESSION_CHANNEL_NAME),
    );
  console.warn("[LocalVault] Tabs cannot tell each other about locking", {
    event: CHANNEL_UNAVAILABLE_EVENT,
  });
  return create_none_option();
}

export function announce_local_unlock_session_ended(): boolean {
  const channel = open_unlock_session_channel();
  if (channel.status !== OptionStatus.SOME) return false;
  channel.value.postMessage(LOCAL_UNLOCK_SESSION_ENDED_MESSAGE);
  channel.value.close();
  return true;
}

export function listen_for_local_unlock_session_ended(
  on_ended: () => boolean,
): () => boolean {
  const channel = open_unlock_session_channel();
  if (channel.status !== OptionStatus.SOME) return () => false;
  const handle_message = (event: MessageEvent): boolean =>
    event.data === LOCAL_UNLOCK_SESSION_ENDED_MESSAGE && on_ended();
  channel.value.addEventListener(MESSAGE_EVENT_NAME, handle_message);
  return () => {
    channel.value.removeEventListener(MESSAGE_EVENT_NAME, handle_message);
    channel.value.close();
    return true;
  };
}
