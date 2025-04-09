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
        
        // Send IDs of all unread notifications to server
        const unreadNotifications = notificationsData.filter(notification => notification.read_at === null);
        if (unreadNotifications.length > 0) {
          const unreadIds = unreadNotifications.map(notification => notification.id);
          await apiService.readNotificationsBatch(unreadIds);
          
          // Update notifications state locally, marking them as read
          setNotifications(notificationsData.map(notification => 
            unreadIds.includes(notification.id) 
              ? { ...notification, read_at: new Date().toISOString() } 
              : notification
          ));
        }
        
        // Update notification counter to refresh badge
        window.dispatchEvent(new CustomEvent('notification-read'));
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    // Get user's timezone
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Format the date as "MMM-DD"
    const month = date.toLocaleString('en-US', { month: 'short', timeZone: userTimeZone });
    const day = date.toLocaleString('en-US', { day: '2-digit', timeZone: userTimeZone });
    return `${month}-${day}`;
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

  const handleNotificationClick = async (notification: Notification) => {
    // Add navigation or action when notification is clicked
    console.log('Notification clicked:', notification);
    
    // If notification is not read, just update UI locally
    if (!notification.read_at) {
      // Update UI to show that notification is read
      setNotifications(prev => 
        prev.map(item => 
          item.id === notification.id 
            ? { ...item, read_at: new Date().toISOString() } 
            : item
        )
      );
      
      // Notify header about changes to update counter
      window.dispatchEvent(new CustomEvent('notification-read'));
    }
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 