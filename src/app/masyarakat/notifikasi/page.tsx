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

  useEffect(() => {
    if (user?.uid) {
      fetchNotifications(user.uid);
    }
  }, [user?.uid, fetchNotifications]);

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
      <div className="mx-auto w-full max-w-md px-4 pb-24 pt-4">
        <HeaderCard 
          title="Notifikasi" 
          subtitle={`${unreadCount} belum dibaca`}
          backUrl="/masyarakat/home"
          showBackButton={true}
        />

        {/* Filter Tabs */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilter('pengaduan')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'pengaduan'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pengaduan
          </button>
          <button
            onClick={() => setFilter('layanan_publik')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'layanan_publik'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Layanan Publik
          </button>
        </div>

        {/* Mark All Read Button */}
        {unreadCount > 0 && (
          <div className="mb-4">
            <button
              onClick={handleMarkAllAsRead}
              className="w-full py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
            >
              Tandai Semua Sudah Dibaca ({unreadCount})
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Memuat notifikasi...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tidak Ada Notifikasi
              </h3>
              <p className="text-gray-600">
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
                className={`border rounded-xl p-4 transition-all hover:shadow-lg ${
                  notification.status === 'unread'
                    ? 'bg-blue-50 border-blue-200 shadow-md'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="text-2xl flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type, notification.priority)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium border ${getPriorityColor(notification.priority)}`}>
                        {getTypeLabel(notification.type)}
                      </span>
                      {notification.status === 'unread' && (
                        <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                          Baru
                        </span>
                      )}
                      {notification.actionRequired && (
                        <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full">
                          Perlu Tindakan
                        </span>
                      )}
                    </div>
                    
                    <h3 className={`font-semibold mb-1 ${
                      notification.status === 'unread' ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {notification.title}
                    </h3>
                    
                    <p className="text-gray-700 text-sm mb-2 leading-relaxed">
                      {notification.message}
                    </p>

                    {/* Metadata */}
                    {notification.metadata && (
                      <div className="text-xs text-gray-500 space-y-1">
                        {notification.metadata.jenisLayanan && (
                          <div>Jenis: {notification.metadata.jenisLayanan}</div>
                        )}
                        {notification.metadata.kategoriPengaduan && (
                          <div>Kategori: {notification.metadata.kategoriPengaduan}</div>
                        )}
                        {notification.metadata.buktiApproval && (
                          <div className="font-mono bg-gray-100 px-2 py-1 rounded">
                            Bukti: {notification.metadata.buktiApproval}
                          </div>
                        )}
                        {notification.metadata.estimasiSelesai && (
                          <div>Estimasi Selesai: {notification.metadata.estimasiSelesai}</div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">
                        {formatDate(notification.createdAt)}
                      </span>
                      {notification.status === 'unread' && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id!)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
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