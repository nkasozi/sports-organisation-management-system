declare global {
  namespace App {
    interface Locals {}
    interface PageData {
      userId?: string | null;
    }
  }
}

export {};
