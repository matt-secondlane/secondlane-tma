import React, { useState, useEffect } from 'react';
import styles from './PortfolioUnlocks.module.css';
import WebApp from '@twa-dev/sdk';
import { apiService } from '../../utils/api';
import { PortfolioAssetUnlockItem } from '../../types/api';
import { Loader } from '../Loader';
import TabsComponent, { TabItem } from '../../components/TabsComponent/TabsComponent';
import UnlocksStackedChart from '../UnlocksStackedChart';
import UnlockCalendar from '../UnlockCalendar';

interface PortfolioUnlocksProps {
  portfolioId: string | undefined;
}

// Date formatting
// const formatDate = (dateString?: string): string => {
//   if (!dateString) return 'N/A';
//   const date = new Date(dateString);
//   return date.toLocaleDateString('en-US', {
//     year: 'numeric',
//     month: 'long',
//     day: 'numeric'
//   });
// };

// Number formatting
const formatNumber = (value?: number): string => {
  if (value === undefined || value === null) return '0';
  // For large numbers, use abbreviated format
  if (value >= 1000000) {
    return (value / 1000000).toFixed(2) + ' mil';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + ' k';
  }
  return Math.round(value).toLocaleString('en-US');
};

// Percentage formatting
const formatPercent = (value?: number): string => {
  if (value === undefined || value === null) return '0%';
  // Round to 2 decimal places
  return `${value.toFixed(2)}%`;
};

// Function to format unlock type for readable display (e.g. "linear" -> "Linear", "cliff" -> "Cliff")
const formatUnlockType = (unlockType: string | null | undefined): string => {
  if (!unlockType) return 'Unknown';
  
  // Convert string with underscores or hyphens to a nice format
  // Example: "LINEAR_VESTING" -> "Linear Vesting"
  return unlockType
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Get unlock status from API
const getUnlockStatus = (item: PortfolioAssetUnlockItem): 'unlocking' | 'unlocked' | 'locked' => {
  return item.unlock?.unlock_status || 'locked';
};

// Форматирование чисел по умолчанию
const defaultFormatNumber = (value: number): string => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(2) + ' mil';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + ' k';
  }
  return Math.round(value).toLocaleString('en-US');
};

// Форматирование процентов по умолчанию
const defaultFormatPercent = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

// Date formatting - more compact format
const defaultFormatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  // Format YYYY-MM-DD for better international support
  return date.toISOString().split('T')[0];
};

export const PortfolioUnlocks: React.FC<PortfolioUnlocksProps> = ({ portfolioId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unlocks, setUnlocks] = useState<PortfolioAssetUnlockItem[]>([]);
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'assets' | 'calendar' | 'charts'>('assets');

  useEffect(() => {
    const fetchUnlocks = async () => {
      if (!portfolioId) {
        setError('Portfolio ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const data = await apiService.getPortfolioUnlocks(portfolioId);
        console.log('Unlocks data received:', data);
        
        // Check data structure
        if (data && data.summary && data.unlocks) {
          // We don't save summary as it's no longer used
          
          // Check unlock data
          const validUnlocks = data.unlocks.filter(item => item && item.asset_id && item.asset_name);
          console.log('Valid unlocks:', validUnlocks);
          
          setUnlocks(validUnlocks);
        } else {
          console.error('Unexpected data structure:', data);
          setError('Received invalid data structure from API');
        }
      } catch (err) {
        console.error('Error fetching unlocks:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load unlock data';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUnlocks();
  }, [portfolioId]);

  const handleAssetClick = (assetId: string) => {
    setExpandedAssetId(prevId => prevId === assetId ? null : assetId);
  };

  // Check for unlock data availability
  const hasUnlockData = unlocks.some(item => item.unlock !== null);

  const handleTabChange = (tabId: string) => {
    WebApp.HapticFeedback.impactOccurred('light');
    setActiveTab(tabId as 'assets' | 'calendar' | 'charts');
  };

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <Loader />
        <p>Loading unlock information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
      </div>
    );
  }

  if (unlocks.length === 0) {
    return (
      <div className={styles.noUnlocks}>
        <p>No unlock information available for assets in this portfolio.</p>
      </div>
    );
  }

  // Sort assets by end date (assets without end date or unlock go to the end)
  const sortedUnlocks = [...unlocks].sort((a, b) => {
    // If no unlock data, put at the end
    if (!a.unlock && !b.unlock) return 0;
    if (!a.unlock) return 1;
    if (!b.unlock) return -1;
    
    // If no end date, put after those with end dates
    if (!a.unlock.end_date && !b.unlock.end_date) return 0;
    if (!a.unlock.end_date) return 1;
    if (!b.unlock.end_date) return -1;
    
    // Sort by end date
    return new Date(a.unlock.end_date).getTime() - new Date(b.unlock.end_date).getTime();
  });

  // Function to display the unlock calendar
  const renderCalendarView = () => {
    // Collect all unlocks into a single array
    const allAllocations = sortedUnlocks
      .filter(item => item.unlock && item.unlock.allocations)
      .flatMap(item => 
        (item.unlock.allocations || []).map(allocation => ({
          asset_id: item.asset_id,
          asset_name: item.asset_name,
          logo: item.logo,
          unlock_date: allocation.unlock_date,
          amount: allocation.amount,
          percent_of_total: allocation.percent_of_total,
          is_cliff: allocation.is_cliff,
          is_tge: allocation.is_tge
        }))
      );

    if (allAllocations.length === 0) {
      return (
        <div className={styles.noUnlockData}>
          <p>No unlock data available to display in the calendar.</p>
          <p className={styles.smallText}>Unlock information will be displayed here when it becomes available.</p>
        </div>
      );
    }

    return (
      <UnlockCalendar 
        unlocks={allAllocations}
        onItemClick={handleAssetClick}
        formatNumber={defaultFormatNumber}
        formatPercent={defaultFormatPercent}
        formatDate={defaultFormatDate}
      />
    );
  };

  const tabs: TabItem[] = [
    { id: 'assets', label: 'Assets' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'charts', label: 'Charts' }
  ];

  return (
    <div className={styles.unlocksContainer}>
      <h2 className={styles.sectionTitle}>Token Unlocks</h2>
      <p className={styles.description}>
        Token unlock schedule for assets in this portfolio
      </p>
      
      <TabsComponent 
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        containerClassname={styles.tabsContainer}
      />

      {!hasUnlockData && (
        <div className={styles.noUnlockData}>
          <p>No unlock data available for assets in this portfolio.</p>
          <p className={styles.smallText}>Unlock information will be displayed here when it becomes available from token issuers.</p>
        </div>
      )}

      {activeTab === 'calendar' ? (
        renderCalendarView()
      ) : activeTab === 'charts' ? (
        <div className={styles.chartsView}>
          <div className={styles.chartSection}>
            <h2 className={styles.chartTitle}>Stacked Unlocks Over Time (by Asset)</h2>
            <div className={styles.chartWrapper}>
              <UnlocksStackedChart unlocks={sortedUnlocks} />
            </div>
          </div>
          
          <div className={styles.assetTable}>
            <h2 className={styles.chartTitle}>Asset table</h2>
            <div className={styles.tableHeader}>
              <div className={styles.tableCell}>Asset</div>
              <div className={styles.tableCell}>Type</div>
            </div>
            {sortedUnlocks.map(item => {
              const status = getUnlockStatus(item);
              
              return (
                <div key={item.asset_id} className={styles.tableRow} onClick={() => handleAssetClick(item.asset_id)}>
                  <div className={styles.tableCell}>
                    <div className={styles.assetNameCell}>
                      {item.logo ? (
                        <img 
                          src={item.logo} 
                          alt={item.asset_name} 
                          className={styles.tableAssetLogo}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/24?text=' + item.asset_name.charAt(0);
                          }}
                        />
                      ) : (
                        <div className={styles.tableAssetLogoPlaceholder}>
                          {item.asset_name.charAt(0)}
                        </div>
                      )}
                      {item.asset_name}
                    </div>
                  </div>
                  <div className={styles.tableCell}>
                    <div className={styles.unlockType}>
                      <span className={`${styles.statusBadge} ${styles[status]}`}>
                        {status === 'unlocking' ? 'Unlocking' : 
                         status === 'unlocked' ? 'Unlocked' : 'Locked'}
                      </span>
                      <span className={styles.unlockTypeLabel}>
                        {item.unlock?.unlock_type ? formatUnlockType(item.unlock.unlock_type) : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={styles.unlocksList}>
        {sortedUnlocks.map((item) => {
          const status = getUnlockStatus(item);
          
          return (
            <div 
              key={item.asset_id} 
              className={`${styles.unlockItem} ${expandedAssetId === item.asset_id ? styles.expanded : ''}`}
              onClick={() => handleAssetClick(item.asset_id)}
            >
              <div className={styles.unlockItemHeader}>
                <div className={styles.assetInfoLarge}>
                  {item.logo ? (
                    <img 
                      src={item.logo} 
                      alt={item.asset_name} 
                      className={styles.assetLogo}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/40?text=' + item.asset_name.charAt(0);
                      }}
                    />
                  ) : (
                    <div className={styles.assetLogoPlaceholder}>
                      {item.asset_name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className={styles.assetName}>{item.asset_name}</h3>
                  </div>
                </div>

                <div className={styles.unlockType}>
                  <span className={`${styles.statusBadge} ${styles[status]}`}>
                    {status === 'unlocking' ? 'Unlocking' : 
                     status === 'unlocked' ? 'Unlocked' : 'Locked'}
                  </span>
                  <span className={styles.unlockTypeLabel}>
                    {item.unlock && item.unlock.unlock_type ? formatUnlockType(item.unlock.unlock_type) : 'Unknown'}
                  </span>
                  {item.unlock ? (
                    <svg className={styles.expandIcon} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <span className={styles.pendingBadge}>No Data</span>
                  )}
                </div>
              </div>

              {expandedAssetId === item.asset_id && item.unlock && (
                <div className={styles.unlockDetails}>
                  <div className={styles.unlockSummary}>
                    <div className={styles.unlockSummaryItem}>
                      <span className={styles.itemLabel}>Period</span>
                      <span className={styles.itemValue}>
                        {defaultFormatDate(item.unlock.start_date)} - {defaultFormatDate(item.unlock.end_date)}
                      </span>
                    </div>
                    
                    {item.unlock.cliff_date && (
                      <div className={styles.unlockSummaryItem}>
                        <span className={styles.itemLabel}>Cliff</span>
                        <span className={styles.itemValue}>{defaultFormatDate(item.unlock.cliff_date)}</span>
                      </div>
                    )}
                    
                    {item.unlock.tge_percent && (
                      <div className={styles.unlockSummaryItem}>
                        <span className={styles.itemLabel}>TGE Unlock</span>
                        <span className={styles.itemValue}>{formatPercent(item.unlock.tge_percent)}</span>
                      </div>
                    )}
                    
                    {item.unlock.total_amount && (
                      <div className={styles.unlockSummaryItem}>
                        <span className={styles.itemLabel}>Total Amount</span>
                        <span className={styles.itemValue}>{formatNumber(item.unlock.total_amount)}</span>
                      </div>
                    )}
                  </div>
                  
                  {item.unlock.allocations && item.unlock.allocations.length > 0 && (
                    <div className={styles.allocations}>
                      <h4 className={styles.allocationsTitle}>Unlock Schedule</h4>
                      <div className={styles.unlockTimeline}>
                        {item.unlock.allocations.map((allocation, index) => (
                          <div key={index} className={styles.allocationItem}>
                            <div className={styles.timelineMarker} />
                            <div className={styles.allocationCard}>
                              <div className={styles.allocationHeader}>
                                <span className={styles.allocationDate}>
                                  {defaultFormatDate(allocation.unlock_date)}
                                  {allocation.is_cliff && <span className={styles.cliffBadge}>Cliff</span>}
                                  {allocation.is_tge && <span className={styles.tgeBadge}>TGE</span>}
                                </span>
                              </div>
                              <div className={styles.allocationDetails}>
                                <div className={styles.allocationRow}>
                                  <span className={styles.allocationLabel}>Amount</span>
                                  <span className={styles.allocationValue}>{formatNumber(allocation.amount)}</span>
                                </div>
                                <div className={styles.allocationRow}>
                                  <span className={styles.allocationLabel}>Percent of Total</span>
                                  <span className={styles.allocationValue}>{formatPercent(allocation.percent_of_total)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {expandedAssetId === item.asset_id && !item.unlock && (
                <div className={styles.unlockDetails}>
                  <div className={styles.noDataMessage}>
                    <p>No unlock data available for this asset yet.</p>
                    <p>This information will be displayed once available from the issuer.</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
};

export default PortfolioUnlocks; 