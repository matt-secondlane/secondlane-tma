import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import logoSecondLane from '../../assets/logoSecondLane.svg';
import bellIcon from '../../assets/bell.svg';

export const Header: React.FC = () => {
  const navigate = useNavigate();

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
          <img src={bellIcon} alt="Notifications" className={styles.icon} />
        </button>
      </div>
    </header>
  );
};
