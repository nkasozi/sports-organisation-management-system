export const PAGINATION_ENTRY_KIND = {
  PAGE: "page",
  ELLIPSIS: "ellipsis",
} as const;

export type PaginationEntry =
  | { kind: typeof PAGINATION_ENTRY_KIND.PAGE; page_number: number }
  | { kind: typeof PAGINATION_ENTRY_KIND.ELLIPSIS };

const MAXIMUM_PAGES_WITHOUT_ELLIPSIS = 7;
const FIRST_PAGE = 1;
const LEADING_ELLIPSIS_THRESHOLD = 3;
const TRAILING_ELLIPSIS_DISTANCE = 2;
const ELLIPSIS_ENTRY: PaginationEntry = {
  kind: PAGINATION_ENTRY_KIND.ELLIPSIS,
};

function to_page_entry(page_number: number): PaginationEntry {
  return { kind: PAGINATION_ENTRY_KIND.PAGE, page_number };
}

function build_page_range(start: number, end: number): PaginationEntry[] {
  const length = Math.max(0, end - start + 1);
  return Array.from({ length }, (_, offset) => to_page_entry(start + offset));
}

export function build_visible_page_entries(
  current_page: number,
  total_pages: number,
): PaginationEntry[] {
  if (total_pages <= MAXIMUM_PAGES_WITHOUT_ELLIPSIS)
    return build_page_range(FIRST_PAGE, total_pages);
  const leading =
    current_page > LEADING_ELLIPSIS_THRESHOLD ? [ELLIPSIS_ENTRY] : [];
  const trailing =
    current_page < total_pages - TRAILING_ELLIPSIS_DISTANCE
      ? [ELLIPSIS_ENTRY]
      : [];
  const middle = build_page_range(
    Math.max(FIRST_PAGE + 1, current_page - 1),
    Math.min(total_pages - 1, current_page + 1),
  );
  return [
    to_page_entry(FIRST_PAGE),
    ...leading,
    ...middle,
    ...trailing,
    to_page_entry(total_pages),
  ];
}
