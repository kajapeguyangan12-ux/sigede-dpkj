"use client";

import React, { useState, useEffect } from 'react';

interface AnimatedCounterProps {
  targetNumber: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  delay?: number;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  targetNumber,
  duration = 2000,
  prefix = '',
  suffix = '',
  className = '',
  delay = 0
}) => {
  const [currentNumber, setCurrentNumber] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (targetNumber > 0) {
        setIsAnimating(true);
        
        const steps = 60; // Number of animation frames
        const stepValue = targetNumber / steps;
        const stepDuration = duration / steps;
        
        let current = 0;
        let step = 0;
        
        const interval = setInterval(() => {
          step++;
          if (step <= steps) {
            // Use easing function for smooth animation
            const progress = step / steps;
            const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
            current = Math.floor(easedProgress * targetNumber);
            setCurrentNumber(current);
          } else {
            setCurrentNumber(targetNumber);
            setIsAnimating(false);
            clearInterval(interval);
          }
        }, stepDuration);
        
        return () => clearInterval(interval);
      } else {
        setCurrentNumber(0);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [targetNumber, duration, delay]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('id-ID');
  };

  return (
    <span className={`${className} ${isAnimating ? 'animate-pulse' : ''}`}>
      {prefix}{formatNumber(currentNumber)}{suffix}
    </span>
  );
};

export default AnimatedCounter;