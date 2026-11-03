export const DROPDOWN_EDGE = {
  TOP: "top",
  BOTTOM: "bottom",
} as const;

type DropdownEdge = (typeof DROPDOWN_EDGE)[keyof typeof DROPDOWN_EDGE];

interface DropdownAnchorRect {
  top: number;
  bottom: number;
  left: number;
  width: number;
}

interface DropdownPlacement {
  edge: DropdownEdge;
  offset: number;
  left: number;
  width: number;
  max_height: number;
}

const DROPDOWN_GAP = 8;
const VIEWPORT_MARGIN = 8;
const PREFERRED_MAX_HEIGHT = 256;

export const INITIAL_DROPDOWN_PLACEMENT: DropdownPlacement = {
  edge: DROPDOWN_EDGE.TOP,
  offset: 0,
  left: 0,
  width: 0,
  max_height: PREFERRED_MAX_HEIGHT,
};

export function compute_dropdown_placement(
  anchor: DropdownAnchorRect,
  viewport_height: number,
): DropdownPlacement {
  const space_below =
    viewport_height - anchor.bottom - DROPDOWN_GAP - VIEWPORT_MARGIN;
  const space_above = anchor.top - DROPDOWN_GAP - VIEWPORT_MARGIN;
  const opens_upward =
    space_below < PREFERRED_MAX_HEIGHT && space_above > space_below;
  return {
    edge: opens_upward ? DROPDOWN_EDGE.BOTTOM : DROPDOWN_EDGE.TOP,
    offset: opens_upward
      ? viewport_height - anchor.top + DROPDOWN_GAP
      : anchor.bottom + DROPDOWN_GAP,
    left: anchor.left,
    width: anchor.width,
    max_height: Math.max(
      0,
      Math.min(PREFERRED_MAX_HEIGHT, opens_upward ? space_above : space_below),
    ),
  };
}

export function format_dropdown_style(placement: DropdownPlacement): string {
  return [
    "position: fixed",
    `${placement.edge}: ${placement.offset}px`,
    `left: ${placement.left}px`,
    `width: ${placement.width}px`,
    `max-height: ${placement.max_height}px`,
  ].join("; ");
}

export function measure_dropdown_placement(
  anchor_element: HTMLElement | undefined,
  current_placement: DropdownPlacement,
): DropdownPlacement {
  if (!anchor_element) return current_placement;
  return compute_dropdown_placement(
    anchor_element.getBoundingClientRect(),
    window.innerHeight,
  );
}

export function watch_anchor_movement(on_move: () => boolean): () => boolean {
  window.addEventListener("scroll", on_move, true);
  window.addEventListener("resize", on_move);
  return (): boolean => {
    window.removeEventListener("scroll", on_move, true);
    window.removeEventListener("resize", on_move);
    return true;
  };
}
