import React from 'react';
import { Home, Database, Wallet } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './BottomNav.module.css';
import WebApp from '@twa-dev/sdk';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    WebApp.HapticFeedback.impactOccurred('light');
    navigate(path);
  };

  return (
    <nav className={styles.bottomNav}>
      <div 
        className={`${styles.navItem} ${location.pathname === '/deals' ? styles.active : ''}`}
        onClick={() => handleNavigation('/deals')}
      >
        <Home size={24} strokeWidth={1.5} />
        <span>Deals</span>
      </div>
      <div 
        className={`${styles.navItem} ${location.pathname === '/database' ? styles.active : ''}`}
        onClick={() => handleNavigation('/database')}
      >
        <Database size={24} strokeWidth={1.5} />
        <span>Database</span>
      </div>
      <div 
        className={`${styles.navItem} ${location.pathname === '/portfolio' ? styles.active : ''}`}
        onClick={() => handleNavigation('/portfolio')}
      >
        <Wallet size={24} strokeWidth={1.5} />
        <span>Portfolio</span>
      </div>
    </nav>
  );
};