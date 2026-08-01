import { useState, useEffect, useRef } from 'react';

interface UseCountUpOptions {
  end: number;
  start?: number;
  duration?: number;
  delay?: number;
  enableScrollSpy?: boolean;
  scrollSpyDelay?: number;
  preserveValue?: boolean;
}

export function useCountUp({
  end,
  start = 0,
  duration = 2000,
  delay = 0,
  enableScrollSpy = false,
  scrollSpyDelay = 0,
  preserveValue = false,
}: UseCountUpOptions) {
  const [count, setCount] = useState<number>(preserveValue ? end : start);
  const [isActive, setIsActive] = useState<boolean>(!enableScrollSpy);
  const animationRef = useRef<number | null>(null);
  const elementRef = useRef<HTMLElement>(null);

  // Easing function for smooth animation
  const easeOutQuart = (t: number): number => {
    return 1 - Math.pow(1 - t, 4);
  };

  const startAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const startTime = performance.now();
    const startValue = preserveValue ? end : start;
    const totalChange = end - startValue;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);
      
      const currentCount = Math.round(startValue + (totalChange * easedProgress));
      setCount(currentCount);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    setTimeout(() => {
      animationRef.current = requestAnimationFrame(animate);
    }, delay);
  };

  // Intersection Observer for scroll spy
  useEffect(() => {
    if (!enableScrollSpy || !elementRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isActive) {
          setTimeout(() => {
            setIsActive(true);
          }, scrollSpyDelay);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(elementRef.current);

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [enableScrollSpy, isActive, scrollSpyDelay]);

  // Start animation when active
  useEffect(() => {
    if (isActive) {
      startAnimation();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, end, start, duration, delay]);

  // Update animation when end value changes
  useEffect(() => {
    if (isActive && !preserveValue) {
      startAnimation();
    } else if (preserveValue) {
      setCount(end);
    }
  }, [end]);

  return {
    count,
    ref: elementRef,
    isActive,
    reset: () => {
      setCount(start);
      setIsActive(!enableScrollSpy);
    },
    start: () => {
      setIsActive(true);
    }
  };
}