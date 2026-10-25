"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * One horizontal row of cards with left/right arrow buttons beside its heading. The row
 * scrolls inside itself (min-w-0 stops it from widening the page), and an arrow is
 * disabled once there's nothing more to see in that direction.
 */
export function CardCarousel({
  label,
  header,
  children
}: {
  label: string;
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = trackRef.current;
    if (!el) return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update]);

  function scroll(direction: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  }

  const arrowCls =
    "flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-forest hover:border-green hover:text-green disabled:cursor-default disabled:border-line disabled:text-[#C3CBC5]";
  const showArrows = canPrev || canNext;

  return (
    <div className="min-w-0" role="region" aria-label={label}>
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">{header}</div>
        {showArrows && (
          <div className="flex flex-shrink-0 gap-2">
            <button type="button" onClick={() => scroll(-1)} disabled={!canPrev} aria-label={`Scroll ${label} left`} className={arrowCls}>
              <Chevron direction="left" />
            </button>
            <button type="button" onClick={() => scroll(1)} disabled={!canNext} aria-label={`Scroll ${label} right`} className={arrowCls}>
              <Chevron direction="right" />
            </button>
          </div>
        )}
      </div>
      <div
        ref={trackRef}
        onScroll={update}
        className="-mx-1 mt-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </div>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={direction === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
    </svg>
  );
}
