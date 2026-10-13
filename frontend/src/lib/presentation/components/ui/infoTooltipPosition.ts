export const TOOLTIP_POSITION = {
  TOP: "top",
  BOTTOM: "bottom",
  LEFT: "left",
  RIGHT: "right",
} as const;

export type TooltipPosition =
  (typeof TOOLTIP_POSITION)[keyof typeof TOOLTIP_POSITION];

interface TooltipPositionClasses {
  panel: string;
  arrow: string;
}

export const TOOLTIP_POSITION_CLASSES: Record<
  TooltipPosition,
  TooltipPositionClasses
> = {
  [TOOLTIP_POSITION.TOP]: {
    panel: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    arrow: "top-full left-1/2 -translate-x-1/2 -mt-1",
  },
  [TOOLTIP_POSITION.BOTTOM]: {
    panel: "top-full left-1/2 -translate-x-1/2 mt-2",
    arrow: "bottom-full left-1/2 -translate-x-1/2 -mb-1",
  },
  [TOOLTIP_POSITION.LEFT]: {
    panel: "right-full top-1/2 -translate-y-1/2 mr-2",
    arrow: "left-full top-1/2 -translate-y-1/2 -ml-1",
  },
  [TOOLTIP_POSITION.RIGHT]: {
    panel: "left-full top-1/2 -translate-y-1/2 ml-2",
    arrow: "right-full top-1/2 -translate-y-1/2 -mr-1",
  },
};
