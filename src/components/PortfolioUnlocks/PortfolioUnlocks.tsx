import React, { useState, useEffect } from 'react';
import styles from './PortfolioUnlocks.module.css';
import WebApp from '@twa-dev/sdk';
import { apiService } from '../../utils/api';
import { PortfolioAssetUnlockItem, PortfolioUnlocksSummary } from '../../types/api';
import { Loader } from '../Loader';
import TabsComponent, { TabItem } from '../../components/TabsComponent/TabsComponent';
import PieChartUnlocks from '../PieChartUnlocks/PieChartUnlocks';

interface PortfolioUnlocksProps {
  portfolioId: string | undefined;
}

// Date formatting
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

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

export const PortfolioUnlocks: React.FC<PortfolioUnlocksProps> = ({ portfolioId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unlocks, setUnlocks] = useState<PortfolioAssetUnlockItem[]>([]);
  const [summary, setSummary] = useState<PortfolioUnlocksSummary | null>(null);
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
          setSummary(data.summary);
          
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

  // Function for displaying the unlock calendar
  const renderCalendarView = () => {
    // Collect all unlocks into a single array
    const allAllocations = unlocks
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
      )
      // Sort by date
      .sort((a, b) => new Date(a.unlock_date).getTime() - new Date(b.unlock_date).getTime());

    if (allAllocations.length === 0) {
      return (
        <div className={styles.noUnlockData}>
          <p>No unlock data available to display in the calendar.</p>
          <p className={styles.smallText}>Unlock information will be displayed here when it becomes available.</p>
        </div>
      );
    }

    // Group unlocks by month
    const groupedByMonth: Record<string, typeof allAllocations> = {};
    
    allAllocations.forEach(allocation => {
      const date = new Date(allocation.unlock_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!groupedByMonth[monthKey]) {
        groupedByMonth[monthKey] = [];
      }
      
      groupedByMonth[monthKey].push(allocation);
    });

    return (
      <div className={styles.calendarView}>
        {Object.entries(groupedByMonth).map(([monthKey, allocations]) => {
          const [year, month] = monthKey.split('-');
          const monthName = new Date(parseInt(year), parseInt(month) - 1, 1)
            .toLocaleString('en-US', { month: 'long', year: 'numeric' });
          
          return (
            <div key={monthKey} className={styles.monthGroup}>
              <h3 className={styles.monthTitle}>{monthName}</h3>
              <div className={styles.monthAllocations}>
                {allocations.map((allocation, index) => (
                  <div key={`${allocation.asset_id}-${index}`} className={styles.calendarItem}>
                    <div className={styles.calendarItemHeader}>
                      <div className={styles.assetInfo}>
                        {allocation.logo ? (
                          <img 
                            src={allocation.logo} 
                            alt={allocation.asset_name} 
                            className={styles.assetLogoSmall}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className={styles.assetIconPlaceholder}>
                            {allocation.asset_name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className={styles.assetNameSmall}>{allocation.asset_name}</span>
                      </div>
                      <div className={styles.unlockDateDisplay}>
                        {formatDate(allocation.unlock_date)}
                        {allocation.is_cliff && <span className={styles.cliffBadge}>Cliff</span>}
                        {allocation.is_tge && <span className={styles.tgeBadge}>TGE</span>}
                      </div>
                    </div>
                    <div className={styles.calendarItemDetails}>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Amount</span>
                        <span className={styles.detailValue}>{formatNumber(allocation.amount)}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>% of total</span>
                        <span className={styles.detailValue}>{formatPercent(allocation.percent_of_total)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Function for displaying the unlock summary
  const renderSummary = () => {
    if (!summary) return null;
    
    return (
      <div className={styles.unlockSummaryContainer}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryRow}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Total tokens</span>
              <span className={styles.summaryValue}>{formatNumber(summary.total_amount_locked + summary.total_amount_unlocked)}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Unlocked</span>
              <span className={styles.summaryValue}>{formatNumber(summary.total_amount_unlocked)} ({formatPercent(summary.unlocked_percent)})</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Locked</span>
              <span className={styles.summaryValue}>{formatNumber(summary.total_amount_locked)} ({formatPercent(summary.locked_percent)})</span>
            </div>
          </div>
          
          {summary.next_unlock_date && (
            <div className={styles.nextUnlock}>
              <span className={styles.nextUnlockLabel}>Next unlock</span>
              <div className={styles.nextUnlockDetails}>
                <span className={styles.nextUnlockDate}>{formatDate(summary.next_unlock_date)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
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
      
      {summary && renderSummary()}
      
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
            <h2 className={styles.chartTitle}>Distribution of unlocks by assets</h2>
            <div className={styles.pieChartWrapper}>
              <PieChartUnlocks unlocks={unlocks} />
            </div>
          </div>
          
          {summary && (
            <div className={styles.summarySection}>
              <h2 className={styles.chartTitle}>Unlock summary</h2>
              <div className={styles.summaryCards}>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryCardTitle}>Total tokens</div>
                  <div className={styles.summaryCardValue}>{formatNumber((summary.total_amount_locked || 0) + (summary.total_amount_unlocked || 0))}</div>
                </div>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryCardTitle}>Unlocked</div>
                  <div className={styles.summaryCardValue}>{formatNumber(summary.total_amount_unlocked || 0)}</div>
                  <div className={styles.summaryCardPercent}>{formatPercent(summary.unlocked_percent || 0)}</div>
                </div>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryCardTitle}>Locked</div>
                  <div className={styles.summaryCardValue}>{formatNumber(summary.total_amount_locked || 0)}</div>
                  <div className={styles.summaryCardPercent}>{formatPercent(summary.locked_percent || 0)}</div>
                </div>
              </div>
            </div>
          )}
          
          <div className={styles.assetTable}>
            <h2 className={styles.chartTitle}>Asset table</h2>
            <div className={styles.tableHeader}>
              <div className={styles.tableCell}>Asset</div>
              <div className={styles.tableCell}>Type</div>
              <div className={styles.tableCell}>Total</div>
            </div>
            {unlocks.map(item => (
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
                <div className={styles.tableCell}>{item.unlock?.unlock_type || 'Unknown'}</div>
                <div className={styles.tableCell}>{formatNumber(item.unlock?.total_amount || 0)}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.unlocksList}>
        {unlocks.map((item) => (
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
                <h3 className={styles.assetName}>{item.asset_name}</h3>
              </div>

              <div className={styles.unlockType}>
                <span className={styles.unlockTypeLabel}>
                  {item.unlock && item.unlock.unlock_type ? item.unlock.unlock_type : 'Unknown'}
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
                      {formatDate(item.unlock.start_date)} - {formatDate(item.unlock.end_date)}
                    </span>
                  </div>
                  
                  {item.unlock.cliff_date && (
                    <div className={styles.unlockSummaryItem}>
                      <span className={styles.itemLabel}>Cliff</span>
                      <span className={styles.itemValue}>{formatDate(item.unlock.cliff_date)}</span>
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
                                {formatDate(allocation.unlock_date)}
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
        ))}
        </div>
      )}
    </div>
  );
};

export default PortfolioUnlocks; 