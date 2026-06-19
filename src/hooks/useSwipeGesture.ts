import { useRef, useCallback, TouchEvent } from 'react';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  minSwipeDistance?: number;
}

/** True when touch started inside a horizontally scrollable region (e.g. workout day picker). */
function isInsideHorizontalScrollArea(target: EventTarget | null): boolean {
  let el = target instanceof HTMLElement ? target : null;
  while (el) {
    if (el.dataset.horizontalScroll === 'true' || el.classList.contains('horizontal-scroll')) {
      return true;
    }
    const { overflowX } = window.getComputedStyle(el);
    if (
      (overflowX === 'auto' || overflowX === 'scroll') &&
      el.scrollWidth > el.clientWidth + 2
    ) {
      return true;
    }
    el = el.parentElement;
  }
  return false;
}

export const useSwipeGesture = (config: SwipeConfig) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    minSwipeDistance = 50
  } = config;

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchEnd = useRef<{ x: number; y: number } | null>(null);
  const touchStartTarget = useRef<EventTarget | null>(null);

  const onTouchStart = useCallback((e: TouchEvent) => {
    touchEnd.current = null;
    touchStartTarget.current = e.target;
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return;

    if (isInsideHorizontalScrollArea(touchStartTarget.current)) {
      touchStartTarget.current = null;
      return;
    }

    const distanceX = touchStart.current.x - touchEnd.current.x;
    const distanceY = touchStart.current.y - touchEnd.current.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (isHorizontalSwipe) {
      if (distanceX > minSwipeDistance && onSwipeLeft) {
        onSwipeLeft();
      } else if (distanceX < -minSwipeDistance && onSwipeRight) {
        onSwipeRight();
      }
    } else {
      if (distanceY > minSwipeDistance && onSwipeUp) {
        onSwipeUp();
      } else if (distanceY < -minSwipeDistance && onSwipeDown) {
        onSwipeDown();
      }
    }
    touchStartTarget.current = null;
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, minSwipeDistance]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  };
};

