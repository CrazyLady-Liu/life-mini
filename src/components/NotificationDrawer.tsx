import { useEffect } from 'react';
import { X, Bell, CheckCheck, ClipboardList, Wrench, AlertTriangle, Warehouse, Info } from 'lucide-react';
import type { Notification, NotificationType } from '@/types';
import { formatDateTime } from '@/utils/format';
import { generateId } from '@/utils/format';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export const mockNotifications: Notification[] = [
  {
    id: generateId(),
    type: 'rental',
    title: '新租赁订单',
    description: '客户张三租赁了帐篷-001，租赁时间6月8日-6月10日',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: generateId(),
    type: 'maintenance',
    title: '维护任务提醒',
    description: '睡袋-003的日常保养任务即将到期，请及时安排',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: generateId(),
    type: 'damage',
    title: '新损耗报告',
    description: '登山包-002报告中等程度损坏，已登记待处理',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: generateId(),
    type: 'inventory',
    title: '盘点提醒',
    description: '本月库存盘点任务已创建，请相关人员尽快完成',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: generateId(),
    type: 'system',
    title: '系统更新通知',
    description: '系统已更新至v2.1.0版本，新增数据导出功能',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

const typeIcons: Record<NotificationType, typeof Bell> = {
  rental: ClipboardList,
  maintenance: Wrench,
  damage: AlertTriangle,
  inventory: Warehouse,
  system: Info,
};

const typeColors: Record<NotificationType, string> = {
  rental: 'bg-emerald-100 text-emerald-600',
  maintenance: 'bg-blue-100 text-blue-600',
  damage: 'bg-amber-100 text-amber-600',
  inventory: 'bg-purple-100 text-purple-600',
  system: 'bg-gray-100 text-gray-600',
};

export default function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationDrawerProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">消息通知</h3>
              <p className="text-sm text-gray-500">
                {unreadCount > 0 ? `${unreadCount} 条未读` : '全部已读'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-b border-gray-100">
          <span className="text-sm font-medium text-gray-700">全部通知</span>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
            >
              <CheckCheck className="w-4 h-4" />
              全部已读
            </button>
          )}
        </div>

        <div className="overflow-y-auto" style={{ height: 'calc(100vh - 140px)' }}>
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Bell className="w-12 h-12 mb-3" />
              <p>暂无通知</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map(notification => {
                const Icon = typeIcons[notification.type];
                return (
                  <div
                    key={notification.id}
                    className={`px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-emerald-50/50' : ''
                    }`}
                    onClick={() => onMarkAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${typeColors[notification.type]}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 mt-1.5"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatDateTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
