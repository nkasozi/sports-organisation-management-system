declare global {
  namespace App {
    interface Locals {}
    interface PageData {
      userId?: string | null;
    }
  }
  interface Window {
    Clerk?: unknown;
    __internal_ClerkUICtor?: unknown;
  }
}

export {};
