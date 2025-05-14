import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { OrderStatus } from '../../lib/supabase';

interface Notification {
  id: string;
  order_id: string;
  order_number: string;
  created_at: string;
  is_read: boolean;
  total_amount: number;
}

export const OrderNotification: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();

    // 设置实时订阅，监听新订单通知
    const subscription = supabase
      .channel('order_notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'order_notifications',
      }, (payload) => {
        // 当有新通知时，更新通知列表
        const newNotification = payload.new as Notification;
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    return () => {
      // 组件卸载时取消订阅
      subscription.unsubscribe();
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      // 获取当前用户的订单通知列表
      const { data, error } = await supabase
        .from('order_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20); // 限制获取最近的20条通知

      if (error) throw error;

      // 格式化通知数据
      const formattedNotifications = data?.map(notification => ({
        id: notification.id,
        order_id: notification.order_id,
        order_number: notification.order_number || `ORD-${notification.order_id.slice(0, 8)}`,
        created_at: new Date(notification.created_at).toLocaleString(),
        is_read: notification.is_read,
        total_amount: notification.total_amount
      })) || [];

      setNotifications(formattedNotifications);
      setUnreadCount(formattedNotifications.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('获取通知列表失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('order_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      // 更新本地状态
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleViewOrder = (orderId: string, notificationId: string) => {
    markAsRead(notificationId);
    navigate(`/admin/orders/${orderId}`);
    setIsOpen(false);
  };

  const toggleNotifications = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      {/* 通知图标和未读数量 */}
      <button
        onClick={toggleNotifications}
        className="relative p-1 rounded-full text-gray-600 hover:text-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* 通知下拉面板 */}
      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">订单通知</h3>
            </div>
            {loading ? (
              <div className="flex justify-center items-center h-24">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="px-4 py-2 text-sm text-red-500">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500">暂无通知</div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${!notification.is_read ? 'bg-blue-50' : ''}`}
                    onClick={() => handleViewOrder(notification.order_id, notification.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {!notification.is_read && (
                            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                          )}
                          新订单: {notification.order_number}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          金额: ¥{notification.total_amount.toFixed(2)}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">{notification.created_at}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="px-4 py-2 border-t border-gray-200">
              <button
                onClick={() => navigate('/admin/orders')}
                className="w-full text-center text-sm text-primary hover:text-primary-dark"
              >
                查看全部订单
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};