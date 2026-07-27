"use client";

import { useEffect, useRef, useState } from "react";

const DURATION_MS = 1200;

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

export function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const frame = useRef<number>();

  useEffect(() => {
    const start = performance.now();

    function tick(now: number) {
      const progress = Math.min((now - start) / DURATION_MS, 1);
      setDisplay(Math.round(value * easeOutQuad(progress)));
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick);
      }
    }

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [value]);

  return <>{display.toLocaleString("en-US")}</>;
}
