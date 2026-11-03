import type { ConceptStatus } from "$lib/presentation/logic/conceptGuideTypes";

export const CONCEPT_STATUS_STYLES: Record<
  ConceptStatus,
  { label: string; classes: string }
> = {
  done: {
    label: "Done",
    classes:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
  todo: {
    label: "To do",
    classes: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  },
  locked: {
    label: "Locked",
    classes: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  },
};
