import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import logoSecondLane from '../../assets/logoSecondLane.svg';
import { apiService } from '../../utils/api';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch unread notifications count
    const fetchUnreadCount = async () => {
      try {
        const count = await apiService.getUnreadNotificationsCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Error fetching unread notifications count:', error);
      }
    };

    fetchUnreadCount();

    // Set up an interval to check for new notifications
    const intervalId = setInterval(fetchUnreadCount, 60000); // Every minute
    
    // Listen for notification-read events
    const handleNotificationRead = () => {
      fetchUnreadCount(); // Refresh count when a notification is read
    };
    
    window.addEventListener('notification-read', handleNotificationRead);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('notification-read', handleNotificationRead);
    };
  }, []);

  const handleNotificationsClick = () => {
    navigate('/notifications');
  };

  return (
    <header className={styles.header}>
      <div className={styles.centerContainer}>
        <div className={styles.userInfo}>
          <img 
            src={logoSecondLane} 
            alt="SecondLane" 
            className={styles.logo}
          />
        </div>
        <button 
          className={styles.iconButton} 
          onClick={handleNotificationsClick}
          aria-label="Notifications"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className={styles.icon}
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span className={styles.notificationBadge} />
          )}
        </button>
      </div>
    </header>
  );
};