import React from 'react';
import styles from './PortfolioTabs.module.css';

export type PortfolioTab = 'manage' | 'summary' | 'history' | 'unlocks';

interface PortfolioTabsProps {
  activeTab: PortfolioTab;
  onTabChange: (tab: PortfolioTab) => void;
  showUnlocksTab?: boolean;
}

export const PortfolioTabs: React.FC<PortfolioTabsProps> = ({ activeTab, onTabChange, showUnlocksTab = false }) => {
  return (
    <div className={styles.tabs}>
      <button
        className={`${styles.tab} ${activeTab === 'manage' ? styles.active : ''}`}
        onClick={() => onTabChange('manage')}
      >
        Manage
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
      {showUnlocksTab && (
        <button
          className={`${styles.tab} ${activeTab === 'unlocks' ? styles.active : ''}`}
          onClick={() => onTabChange('unlocks')}
        >
          Unlocks
        </button>
      )}
    </div>
  );
};

export default PortfolioTabs; 