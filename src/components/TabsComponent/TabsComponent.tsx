import React from 'react';
import styles from './TabsComponent.module.css';

export interface TabItem {
  id: string;
  label: string;
}

interface TabsComponentProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabClassname?: string;
  activeTabClassname?: string;
  containerClassname?: string;
}

/**
 * Universal tabs component
 * @param tabs - array of tabs with id and label
 * @param activeTab - id of the active tab
 * @param onTabChange - function to handle tab change
 * @param tabClassname - additional class for tab button
 * @param activeTabClassname - additional class for active tab
 * @param containerClassname - additional class for tabs container
 */
export const TabsComponent: React.FC<TabsComponentProps> = ({
  tabs,
  activeTab,
  onTabChange,
  tabClassname = '',
  activeTabClassname = '',
  containerClassname = '',
}) => {
  return (
    <div className={`${styles.tabsContainer} ${containerClassname}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`${styles.tabButton} ${
            activeTab === tab.id ? `${styles.activeTab} ${activeTabClassname}` : ''
          } ${tabClassname}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabsComponent; 