"use client";
import React, { useEffect, useState } from 'react';

interface AnimatedWrapperProps {
  children: React.ReactNode;
  animation?: 'fadeInUp' | 'slideInLeft' | 'slideInRight' | 'scaleIn' | 'bounceIn' | 'staggerFadeIn';
  delay?: number;
  duration?: number;
  className?: string;
}

export default function AnimatedWrapper({ 
  children, 
  animation = 'fadeInUp', 
  delay = 0, 
  duration = 600,
  className = '' 
}: AnimatedWrapperProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const getAnimationClass = () => {
    switch (animation) {
      case 'fadeInUp':
        return 'animate-fade-in-up';
      case 'slideInLeft':
        return 'animate-slide-in-left';
      case 'slideInRight':
        return 'animate-slide-in-right';
      case 'scaleIn':
        return 'animate-scale-in';
      case 'bounceIn':
        return 'animate-bounce-in';
      case 'staggerFadeIn':
        return 'animate-stagger-fade-in';
      default:
        return 'animate-fade-in-up';
    }
  };

  return (
    <div 
      className={`${isVisible ? getAnimationClass() : 'opacity-0'} ${className}`}
      style={{
        animationDuration: `${duration}ms`,
        animationFillMode: 'both'
      }}
    >
      {children}
    </div>
  );
}

// Hook untuk staggered animations
export function useStaggeredAnimation(items: any[], baseDelay: number = 100) {
  return items.map((item, index) => ({
    ...item,
    delay: index * baseDelay
  }));
}

// Komponen untuk grid items dengan staggered animation
interface AnimatedGridProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  animation?: 'fadeInUp' | 'scaleIn' | 'bounceIn';
  className?: string;
}

export function AnimatedGrid({ 
  children, 
  staggerDelay = 150, 
  animation = 'fadeInUp',
  className = '' 
}: AnimatedGridProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <AnimatedWrapper
          key={index}
          animation={animation}
          delay={index * staggerDelay}
          className="h-full"
        >
          {child}
        </AnimatedWrapper>
      ))}
    </div>
  );
}