export const PROFILE_MANAGEMENT_ACTIONS = {
  READ: "read",
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
} as const;

export const PROFILE_MANAGEMENT_VISIBILITY_CLASS_BY_VALUE: Record<
  string,
  string
> = {
  public:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  private:
    "bg-accent-100 text-accent-700 dark:bg-accent-700 dark:text-accent-300",
};

export const PROFILE_MANAGEMENT_STATUS_CLASS_BY_VALUE: Record<string, string> =
  {
    active:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    inactive:
      "bg-accent-100 text-accent-700 dark:bg-accent-700 dark:text-accent-300",
  };

export const PROFILE_MANAGEMENT_PREVIEW_PATH_SEPARATOR = "/";
