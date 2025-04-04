import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../utils/api';
import type { Notification, NotificationEventType } from '../../types/api';
import styles from './NotificationsScreen.module.css';
import { Loader } from '../../components/Loader/Loader';

export const NotificationsScreen: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [eventTypes, setEventTypes] = useState<NotificationEventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Load notifications and event types in parallel
        const [notificationsData, eventTypesData] = await Promise.all([
          apiService.getNotifications(),
          apiService.getNotificationEventTypes()
        ]);
        
        setNotifications(notificationsData);
        setEventTypes(eventTypesData);
        setError(null);
      } catch (err) {
        setError('Failed to load notifications');
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSettingsClick = () => {
    navigate('/notification-settings');
  };

  const handleMarkAsRead = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await apiService.markNotificationAsRead(notificationId);
      
      // Update local notifications list
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read_at: new Date().toISOString() } 
            : notification
        )
      );
      
      // Dispatch a custom event to notify other components about the read status change
      window.dispatchEvent(new CustomEvent('notification-read'));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // Ensure both dates are in UTC for comparison
    const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    const utcNow = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    
    const diffMs = utcNow.getTime() - utcDate.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'min' : 'mins'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return new Intl.DateTimeFormat('en-US', {
        day: '2-digit',
        month: 'short',
      }).format(date);
    }
  };

  const getNotificationIcon = (type: string) => {
    // Get the base type from notification_type (remove any possible suffix)
    const baseType = type.split('.')[0];
    
    // Search for the base type among loaded event types
    switch (baseType) {
      case 'order_inquiry':
        return '📨';
      case 'newsletter':
        return '📰';
      case 'system':
        return '🔔';
      case 'outreach':
        return '🤝';
      default:
        return '📩';
    }
  };

  const getNotificationTypeName = (type: string) => {
    // Get the base type from notification_type
    const baseType = type.split('.')[0];
    
    // Find the corresponding event type
    const eventType = eventTypes.find(et => et.code.startsWith(baseType));
    
    // Return the type name or format string from notification_type
    return eventType ? eventType.name : type.replace('_', ' ');
  };

  const handleNotificationClick = (notification: Notification) => {
    // Add navigation or action when notification is clicked
    console.log('Notification clicked:', notification);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Notifications</h1>
        <button 
          className={styles.settingsButton}
          onClick={handleSettingsClick}
        >
          Settings
        </button>
      </div>

      <div className={styles.notificationsContent}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <Loader />
          </div>
        ) : error ? (
          <div className={styles.error}>
            {error}
            <button 
              className={styles.retryButton}
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className={styles.emptyContainer}>
            <div className={styles.emptyIcon}>📭</div>
            <div className={styles.empty}>You have no notifications</div>
            <p className={styles.emptyDescription}>
              When you receive notifications, they will appear here
            </p>
          </div>
        ) : (
          <div className={styles.notificationsList}>
            {notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`${styles.notificationItem} ${!notification.read_at ? styles.unread : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className={styles.notificationContent}>
                  <div className={styles.notificationHeader}>
                    <div className={styles.notificationType}>
                      {getNotificationIcon(notification.notification_type)} {getNotificationTypeName(notification.notification_type)}
                    </div>
                    <div className={styles.notificationDate}>
                      {formatDate(notification.created_at)}
                    </div>
                  </div>
                  <div className={styles.notificationMessage}>
                    {notification.message}
                  </div>
                </div>
                {!notification.read_at && (
                  <div className={styles.notificationActions}>
                    <button 
                      className={styles.markAsReadButton}
                      onClick={(e) => handleMarkAsRead(notification.id, e)}
                    >
                      Read
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 