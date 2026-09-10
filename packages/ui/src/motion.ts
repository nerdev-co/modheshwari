"use client";

import { Variants, Transition } from "framer-motion";

export const SPRING_CURVE = [0.16, 1, 0.3, 1] as const;

export const MOTION_ENTER: Transition = {
  duration: 0.2,
  ease: SPRING_CURVE,
};

export const MOTION_EXIT: Transition = {
  duration: 0.15,
  ease: SPRING_CURVE,
};

export const MOTION_PAGE_ENTER: Transition = {
  duration: 0.4,
  ease: SPRING_CURVE,
};

export const FADE_IN: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const FADE_IN_UP: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

export const SCALE_IN: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1 },
};

export const SLIDE_IN_TOP: Variants = {
  hidden: { opacity: 0, y: -8, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1 },
};
