"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import HeaderCard from "../../components/HeaderCard";
import BottomNavigation from '../../components/BottomNavigation';
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  UniversalNotification
} from "../../../lib/notificationService";
import { useAuth } from "../../../contexts/AuthContext";

const getNotificationIcon = (type: 'pengaduan' | 'layanan_publik', priority: string) => {
  if (type === 'pengaduan') {
    switch (priority) {
      case 'high': return '🚨';
      case 'medium': return '📝';
      case 'low': return '📄';
      default: return '📋';
    }
  } else {
    switch (priority) {
      case 'high': return '📄';
      case 'medium': return '📋';
      case 'low': return '📝';
      default: return '📊';
    }
  }
};

const getTypeLabel = (type: 'pengaduan' | 'layanan_publik') => {
  return type === 'pengaduan' ? 'Pengaduan' : 'Layanan Publik';
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'medium':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'low':
      return 'text-green-600 bg-green-50 border-green-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export default function NotifikasiPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<UniversalNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pengaduan' | 'layanan_publik'>('all');
  const [hasAutoMarked, setHasAutoMarked] = useState(false);

  const fetchNotifications = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const data = await getUserNotifications(userId);
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (user?.uid) {
      fetchNotifications(user.uid);
    }
  }, [user?.uid, fetchNotifications]);

  // Auto-mark notifications as read after page load
  useEffect(() => {
    if (user?.uid && !hasAutoMarked && notifications.length > 0) {
      const hasUnread = notifications.some(n => n.status === 'unread');
      if (hasUnread) {
        const timer = setTimeout(() => {
          markAllNotificationsAsRead(user.uid).then(() => {
            setHasAutoMarked(true);
            // Refresh notifications after marking
            fetchNotifications(user.uid);
          }).catch(err => 
            console.error('Failed to auto-mark notifications:', err)
          );
        }, 2000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [user?.uid, notifications, hasAutoMarked, fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, status: 'read' as const }
            : notif
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.uid) return;
    
    try {
      await markAllNotificationsAsRead(user.uid);
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, status: 'read' as const }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    return notif.type === filter;
  });

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-6 pt-3 sm:pt-4">
        <HeaderCard 
          title="Notifikasi" 
          subtitle={`${unreadCount} belum dibaca`}
          backUrl="/masyarakat/home"
          showBackButton={true}
        />

        {/* Filter Tabs */}
        <div className="mb-4 sm:mb-6 flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-medium transition-all shadow-sm ${
              filter === 'all'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilter('pengaduan')}
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-medium transition-all shadow-sm ${
              filter === 'pengaduan'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pengaduan
          </button>
          <button
            onClick={() => setFilter('layanan_publik')}
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-medium transition-all shadow-sm ${
              filter === 'layanan_publik'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Layanan Publik
          </button>
        </div>

        {/* Mark All Read Button */}
        {unreadCount > 0 && (
          <div className="mb-4 sm:mb-6">
            <button
              onClick={handleMarkAllAsRead}
              className="w-full py-2.5 sm:py-3 px-4 sm:px-6 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors text-sm sm:text-base font-medium shadow-md hover:shadow-lg"
            >
              Tandai Semua Sudah Dibaca ({unreadCount})
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {loading ? (
            <div className="lg:col-span-2 text-center py-12 sm:py-16">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-3 sm:mt-4 text-sm sm:text-base">Memuat notifikasi...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="lg:col-span-2 text-center py-12 sm:py-16 lg:py-20">
              <div className="text-5xl sm:text-6xl lg:text-7xl mb-4 sm:mb-6">📭</div>
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-2">
                Tidak Ada Notifikasi
              </h3>
              <p className="text-sm sm:text-base text-gray-600 px-4">
                {filter === 'all' 
                  ? 'Belum ada notifikasi untuk ditampilkan'
                  : `Tidak ada notifikasi ${getTypeLabel(filter)}`
                }
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`border rounded-2xl p-4 sm:p-5 transition-all hover:shadow-xl hover:scale-[1.01] ${
                  notification.status === 'unread'
                    ? 'bg-blue-50 border-blue-200 shadow-md'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Icon */}
                  <div className="text-2xl sm:text-3xl flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type, notification.priority)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`text-xs sm:text-sm px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full font-medium border ${getPriorityColor(notification.priority)}`}>
                        {getTypeLabel(notification.type)}
                      </span>
                      {notification.status === 'unread' && (
                        <span className="text-xs sm:text-sm bg-red-500 text-white px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full font-medium">
                          Baru
                        </span>
                      )}
                      {notification.actionRequired && (
                        <span className="text-xs sm:text-sm bg-orange-500 text-white px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full font-medium">
                          Perlu Tindakan
                        </span>
                      )}
                    </div>
                    
                    <h3 className={`font-semibold text-sm sm:text-base mb-2 ${
                      notification.status === 'unread' ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {notification.title}
                    </h3>
                    
                    <p className="text-gray-700 text-sm sm:text-base mb-3 leading-relaxed">
                      {notification.message}
                    </p>

                    {/* Metadata */}
                    {notification.metadata && (
                      <div className="text-xs sm:text-sm text-gray-500 space-y-1.5 sm:space-y-2">
                        {notification.metadata.jenisLayanan && (
                          <div>Jenis: {notification.metadata.jenisLayanan}</div>
                        )}
                        {notification.metadata.kategoriPengaduan && (
                          <div>Kategori: {notification.metadata.kategoriPengaduan}</div>
                        )}
                        {notification.metadata.buktiApproval && (
                          <div className="font-mono bg-gray-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg">
                            Bukti: {notification.metadata.buktiApproval}
                          </div>
                        )}
                        {notification.metadata.estimasiSelesai && (
                          <div>Estimasi Selesai: {notification.metadata.estimasiSelesai}</div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-3 sm:mt-4">
                      <span className="text-xs sm:text-sm text-gray-500">
                        {formatDate(notification.createdAt)}
                      </span>
                      {notification.status === 'unread' && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id!)}
                          className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
                        >
                          Tandai Dibaca
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}