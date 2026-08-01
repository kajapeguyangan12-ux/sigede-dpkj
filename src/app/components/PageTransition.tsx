"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Skip loading animation on initial page load
    if (isInitialLoad) {
      setIsInitialLoad(false);
      setDisplayChildren(children);
      return;
    }

    // Start loading animation
    setIsLoading(true);

    // Small delay to ensure smooth transition
    const timer = setTimeout(() => {
      setDisplayChildren(children);

      // Additional delay before hiding loading to ensure content is ready
      setTimeout(() => {
        setIsLoading(false);
      }, 100);
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname, children, isInitialLoad]);

  return (
    <div className="relative min-h-screen">
      {/* Centered logo loading indicator */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="flex items-center space-x-3 bg-white/90 backdrop-blur-sm rounded-full px-4 py-3 shadow-lg border border-gray-200">
            <div className="w-5 h-5 border-2 border-red-200 border-t-red-500 rounded-full animate-spin"></div>
          </div>
        </div>
      )}

      {/* Content with smooth transition */}
      <div
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-70' : 'opacity-100'
        }`}
      >
        {displayChildren}
      </div>
    </div>
  );
}
