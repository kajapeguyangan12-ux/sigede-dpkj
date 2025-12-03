"use client";
import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToUserNotifications } from '../lib/notificationService';

interface NavItem {
  label: string;
  icon: string;
  href: string;
  activePattern: string;
}

export default function MasyarakatBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;

    // Subscribe to notifications real-time
    const unsubscribe = subscribeToUserNotifications(user.uid, (notifications) => {
      const unreadNotifications = notifications.filter(notif => notif.status === 'unread');
      setUnreadCount(unreadNotifications.length);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const navItems: NavItem[] = [
    {
      label: 'Beranda',
      icon: 'home',
      href: '/masyarakat',
      activePattern: '^/masyarakat$'
    },
    {
      label: 'Riwayat',
      icon: 'history',
      href: '/masyarakat/riwayat',
      activePattern: '^/masyarakat/riwayat'
    },
    {
      label: 'Notifikasi',
      icon: 'bell',
      href: '/masyarakat/notifikasi',
      activePattern: '^/masyarakat/notifikasi'
    },
    {
      label: 'Profil',
      icon: 'user',
      href: '/masyarakat/profil',
      activePattern: '^/masyarakat/profil'
    }
  ];

  const isActive = (pattern: string) => {
    const regex = new RegExp(pattern);
    return regex.test(pathname);
  };

  const getIconColor = (active: boolean) => {
    return active ? 'text-white' : 'text-gray-400';
  };

  const getBgColor = (active: boolean) => {
    return active ? 'bg-gradient-to-br from-red-500 to-pink-600' : 'bg-gray-50';
  };

  const renderIcon = (iconName: string, active: boolean) => {
    const className = `w-6 h-6 ${getIconColor(active)}`;
    const strokeWidth = active ? 2.5 : 2;

    switch (iconName) {
      case 'home':
        return (
          <svg className={className} fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={strokeWidth} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case 'history':
        return (
          <svg className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'bell':
        return (
          <svg className={className} fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={strokeWidth} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
      case 'user':
        return (
          <svg className={className} fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={strokeWidth} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-2xl safe-area-bottom">
      <div className="max-w-lg mx-auto">
        <div className="grid grid-cols-4 gap-1 px-2 py-3">
          {navItems.map((item) => {
            const active = isActive(item.activePattern);
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="flex flex-col items-center justify-center gap-1 relative group"
              >
                {/* Icon Container with Badge */}
                <div className="relative">
                  <div className={`w-12 h-12 rounded-2xl ${getBgColor(active)} flex items-center justify-center transition-all duration-300 ${active ? 'shadow-lg shadow-red-500/30' : 'group-hover:bg-gray-100'}`}>
                    {renderIcon(item.icon, active)}
                  </div>
                  
                  {/* Badge for Notifikasi */}
                  {item.icon === 'bell' && unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
                      <span className="text-white text-xs font-bold px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Label */}
                <span className={`text-xs font-medium transition-colors duration-300 ${active ? 'text-red-600' : 'text-gray-600'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      
      <style jsx>{`
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .safe-area-bottom {
            padding-bottom: env(safe-area-inset-bottom);
          }
        }
      `}</style>
    </div>
  );
}
