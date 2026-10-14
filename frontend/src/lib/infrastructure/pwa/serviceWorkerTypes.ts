export interface ServiceWorkerExtendableEvent extends Event {
  waitUntil(promise: Promise<unknown>): void;
}

export interface ServiceWorkerFetchEvent extends ServiceWorkerExtendableEvent {
  request: Request;
  respondWith(response: Promise<Response>): void;
}

export interface ServiceWorkerScope {
  location: { origin: string };
  addEventListener(
    type: "install" | "activate",
    listener: (event: ServiceWorkerExtendableEvent) => void,
  ): void;
  addEventListener(
    type: "fetch",
    listener: (event: ServiceWorkerFetchEvent) => void,
  ): void;
}
