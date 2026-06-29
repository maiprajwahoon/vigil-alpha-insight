import * as React from "react";

type MotionComponent = React.ComponentType<Record<string, unknown>>;

const motionOnlyProps = new Set([
  "animate",
  "exit",
  "initial",
  "layout",
  "layoutId",
  "transition",
  "variants",
  "whileFocus",
  "whileHover",
  "whileInView",
  "whileTap",
  "viewport",
]);

const cache = new Map<string, MotionComponent>();

function getMotionTag(tag: string): MotionComponent {
  const cached = cache.get(tag);
  if (cached) return cached;

  const MotionTag = React.forwardRef<HTMLElement | SVGElement, Record<string, unknown>>(
    function MotionTag(props, ref) {
      const cleanProps: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(props)) {
        if (!motionOnlyProps.has(key)) {
          cleanProps[key] = value;
        }
      }
      cleanProps.ref = ref;
      return React.createElement(tag, cleanProps);
    },
  );

  cache.set(tag, MotionTag as MotionComponent);
  return MotionTag as MotionComponent;
}

export const motion = new Proxy(
  {},
  {
    get(_target, prop) {
      return getMotionTag(String(prop));
    },
  },
) as Record<string, MotionComponent>;
