import { useRef, useEffect } from 'react';

interface UseHorizontalScrollOptions {
  scrollStep?: number;
  snapToItems?: boolean;
  enableSwipe?: boolean;
}

export const useHorizontalScroll = (options: UseHorizontalScrollOptions = {}) => {
  const {
    scrollStep = 300,
    snapToItems = true,
    enableSwipe = true
  } = options;

  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  // Smooth scroll to specific position
  const scrollTo = (position: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: position,
        behavior: 'smooth'
      });
    }
  };

  // Scroll by step
  const scrollBy = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const items = container.querySelectorAll('[data-scroll-item]');
      
      if (items.length === 0) return;
      
      const containerWidth = container.clientWidth;
      const currentScroll = container.scrollLeft;
      
      // Calculate the scroll step based on container width for single-item scrolling
      const step = containerWidth;
      const newScroll = direction === 'left' 
        ? Math.max(0, currentScroll - step)
        : Math.min(container.scrollWidth - containerWidth, currentScroll + step);
      
      scrollTo(newScroll);
    }
  };

  // Snap to nearest item
  const snapToNearestItem = () => {
    if (!scrollRef.current || !snapToItems) return;

    const container = scrollRef.current;
    const items = container.querySelectorAll('[data-scroll-item]');
    
    if (items.length === 0) return;

    const containerWidth = container.clientWidth;
    const currentScroll = container.scrollLeft;
    
    // Find which item is currently most visible
    let closestItem = items[0];
    let closestDistance = Math.abs(items[0].getBoundingClientRect().left - container.getBoundingClientRect().left);

    items.forEach((item) => {
      const itemRect = item.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const distance = Math.abs(itemRect.left - containerRect.left);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestItem = item;
      }
    });

    if (closestItem) {
      const itemIndex = Array.from(items).indexOf(closestItem);
      const scrollLeft = itemIndex * containerWidth;
      scrollTo(scrollLeft);
    }
  };

  // Touch/swipe handling
  useEffect(() => {
    if (!enableSwipe || !scrollRef.current) return;

    const container = scrollRef.current;
    let startX = 0;
    let startScrollLeft = 0;
    let isDragging = false;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startScrollLeft = container.scrollLeft;
      isDragging = true;
      isScrollingRef.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      
      e.preventDefault();
      const currentX = e.touches[0].clientX;
      const diff = startX - currentX;
      container.scrollLeft = startScrollLeft + diff;
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;
      
      isDragging = false;
      isScrollingRef.current = false;
      
      // Snap to nearest item after touch ends
      setTimeout(() => {
        if (snapToItems) {
          snapToNearestItem();
        }
      }, 100);
    };

    // Mouse drag support for desktop
    const handleMouseDown = (e: MouseEvent) => {
      startX = e.clientX;
      startScrollLeft = container.scrollLeft;
      isDragging = true;
      isScrollingRef.current = true;
      container.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      e.preventDefault();
      const currentX = e.clientX;
      const diff = startX - currentX;
      container.scrollLeft = startScrollLeft + diff;
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      
      isDragging = false;
      isScrollingRef.current = false;
      container.style.cursor = 'grab';
      
      // Snap to nearest item after mouse up
      setTimeout(() => {
        if (snapToItems) {
          snapToNearestItem();
        }
      }, 100);
    };

    // Add event listeners
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseUp);

    // Set initial cursor
    container.style.cursor = 'grab';

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [enableSwipe, snapToItems]);

  return {
    scrollRef,
    scrollTo,
    scrollBy,
    snapToNearestItem,
    isScrolling: isScrollingRef.current
  };
};
