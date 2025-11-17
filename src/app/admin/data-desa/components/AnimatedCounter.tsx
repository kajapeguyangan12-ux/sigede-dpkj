import React from 'react';
import { useCountUp } from '../../../../hooks/useCountUp';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  delay?: number;
  className?: string;
  formatNumber?: boolean;
  prefix?: string;
  suffix?: string;
  enableScrollSpy?: boolean;
  scrollSpyDelay?: number;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 2000,
  delay = 0,
  className = "",
  formatNumber = true,
  prefix = "",
  suffix = "",
  enableScrollSpy = true,
  scrollSpyDelay = 200
}) => {
  const { count, ref } = useCountUp({
    end: value,
    start: 0,
    duration,
    delay,
    enableScrollSpy,
    scrollSpyDelay,
    preserveValue: false
  });

  const formatValue = (num: number): string => {
    if (!formatNumber) return num.toString();
    return num.toLocaleString();
  };

  return (
    <span 
      ref={ref as React.RefObject<HTMLSpanElement>}
      className={className}
    >
      {prefix}{formatValue(count)}{suffix}
    </span>
  );
};

export default AnimatedCounter;