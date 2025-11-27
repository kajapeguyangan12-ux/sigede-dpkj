"use client";

import Image from "next/image";
import Link from "next/link";

type Props = {
  title?: string;
  backUrl?: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
};

const DesaLogo = "/logo/LOGO_DPKJ.png";
const BGDLogo = "/logo/BDG1.png";

// Custom arrow left icon component
const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

export default function HeaderCard({ title = "Beranda", backUrl = "/masyarakat/home", subtitle, showBackButton = false, onBack }: Props) {
  return (
    <div className="mb-4 sm:mb-5 md:mb-6 lg:mb-7 mt-3 sm:mt-4 overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-xl ring-1 ring-gray-200/50 backdrop-blur-xl">
      <div className="relative">
        {/* Enhanced Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-red-600 to-red-700 opacity-95"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-white/10"></div>
        
        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)`
        }}></div>

        <div className="relative z-10 flex items-center justify-between gap-2 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6 px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-3 sm:py-4 md:py-5 lg:py-6 xl:py-7">
          {/* Left Section - BGD Logo or Back Button */}
          {showBackButton ? (
            onBack ? (
              <button 
                onClick={onBack}
                className="group flex h-7 w-7 xs:h-8 xs:w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm transition-all duration-300 hover:bg-white/30 hover:scale-105 active:scale-95 flex-shrink-0 touch-manipulation"
              >
                <ArrowLeftIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white transition-transform group-hover:-translate-x-0.5" />
              </button>
            ) : (
              <Link 
                href={backUrl} 
                className="group flex h-7 w-7 xs:h-8 xs:w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm transition-all duration-300 hover:bg-white/30 hover:scale-105 active:scale-95 flex-shrink-0 touch-manipulation"
              >
                <ArrowLeftIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white transition-transform group-hover:-translate-x-0.5" />
              </Link>
            )
          ) : (
            <div className="flex h-7 w-7 xs:h-8 xs:w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 items-center justify-center rounded-full overflow-hidden bg-white/95 backdrop-blur-sm shadow-sm ring-1 ring-white/20 flex-shrink-0">
              <Image
                src={BGDLogo}
                alt="BGD Logo"
                width={28}
                height={28}
                className="object-contain w-5 h-5 sm:w-7 sm:h-7 lg:w-8 lg:h-8"
                priority
              />
            </div>
          )}

          {/* Center Section - Title & Subtitle */}
          <div className="text-center flex-1 px-1 sm:px-2 min-w-0">
            <h1 className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-white tracking-wide truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[9px] xs:text-[10px] sm:text-xs lg:text-sm text-white/80 font-medium mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>

          {/* Right Section - DPKJ Logo */}
          <div className="flex h-7 w-7 xs:h-8 xs:w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 items-center justify-center overflow-hidden rounded-lg sm:rounded-xl bg-white/95 backdrop-blur-sm shadow-sm ring-1 ring-white/20 flex-shrink-0">
            <Image
              src={DesaLogo}
              alt="Dauh Puri Kaja"
              width={28}
              height={28}
              className="object-contain w-5 h-5 sm:w-7 sm:h-7 lg:w-8 lg:h-8"
              priority
              onError={(e) => {
                console.log('DPKJ Logo failed to load');
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* Bottom Accent Line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
      </div>
    </div>
  );
}
