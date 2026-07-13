import { useRef, useCallback } from 'react';

interface UseHorizontalScrollOptions {
  scrollStep?: number;
  snapToItems?: boolean;
  enableSwipe?: boolean;
}

/**
 * Lightweight horizontal scroll helper for pill/card strips.
 * Relies on native overflow + CSS scroll-snap for smooth phone swipes
 * (custom touch preventDefault was fighting momentum scrolling).
 */
export const useHorizontalScroll = (options: UseHorizontalScrollOptions = {}) => {
  const { scrollStep = 140 } = options;
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollTo = useCallback((position: number) => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({ left: position, behavior: 'smooth' });
  }, []);

  const scrollBy = useCallback(
    (direction: 'left' | 'right') => {
      const container = scrollRef.current;
      if (!container) return;

      const items = container.querySelectorAll<HTMLElement>('[data-scroll-item]');
      let step = scrollStep;

      if (items.length > 0) {
        const first = items[0];
        const second = items[1];
        if (second) {
          step = second.offsetLeft - first.offsetLeft;
        } else {
          step = first.offsetWidth + 8;
        }
      }

      const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
      const next =
        direction === 'left'
          ? Math.max(0, container.scrollLeft - step)
          : Math.min(maxScroll, container.scrollLeft + step);

      container.scrollTo({ left: next, behavior: 'smooth' });
    },
    [scrollStep]
  );

  const snapToNearestItem = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const items = Array.from(container.querySelectorAll<HTMLElement>('[data-scroll-item]'));
    if (items.length === 0) return;

    const containerLeft = container.getBoundingClientRect().left;
    let closest = items[0];
    let closestDistance = Math.abs(closest.getBoundingClientRect().left - containerLeft);

    for (const item of items) {
      const distance = Math.abs(item.getBoundingClientRect().left - containerLeft);
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = item;
      }
    }

    const targetLeft = container.scrollLeft + (closest.getBoundingClientRect().left - containerLeft);
    container.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
  }, []);

  return {
    scrollRef,
    scrollTo,
    scrollBy,
    snapToNearestItem,
    isScrolling: false,
  };
};
