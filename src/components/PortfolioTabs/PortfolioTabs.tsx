import React from 'react';
import styles from './PortfolioTabs.module.css';

export type PortfolioTab = 'manage' | 'summary' | 'history';

interface PortfolioTabsProps {
  activeTab: PortfolioTab;
  onTabChange: (tab: PortfolioTab) => void;
}

export const PortfolioTabs: React.FC<PortfolioTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className={styles.tabs}>
      <button
        className={`${styles.tab} ${activeTab === 'manage' ? styles.active : ''}`}
        onClick={() => onTabChange('manage')}
      >
        Management
      </button>
      <button
        className={`${styles.tab} ${activeTab === 'summary' ? styles.active : ''}`}
        onClick={() => onTabChange('summary')}
      >
        Summary
      </button>
      <button
        className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
        onClick={() => onTabChange('history')}
      >
        History
      </button>
    </div>
  );
};

export default PortfolioTabs; 