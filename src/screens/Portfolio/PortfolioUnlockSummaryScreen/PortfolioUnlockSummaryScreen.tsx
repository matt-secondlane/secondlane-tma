import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { apiService } from '../../../utils/api';
import { PortfolioUnlockSummaryItem, PortfolioUnlocksSummary } from '../../../types/api';
import { Loader } from '../../../components/Loader';
import styles from './PortfolioUnlockSummaryScreen.module.css';
import TabsComponent, { TabItem } from '../../../components/TabsComponent/TabsComponent';

// Date formatting
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
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

// Formatting unlock type (e.g., "custom" → "Custom")
const formatUnlockType = (unlockType: string | null | undefined): string => {
  if (!unlockType) return 'Unknown type';
  
  // Convert string with underscores or hyphens to a readable format
  const formattedType = unlockType
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
    
  return formattedType;
};

export const PortfolioUnlockSummaryScreen: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unlockData, setUnlockData] = useState<PortfolioUnlockSummaryItem[]>([]);
  const [summary, setSummary] = useState<PortfolioUnlocksSummary | null>(null);
  const [groupedByPortfolio, setGroupedByPortfolio] = useState<Record<string, PortfolioUnlockSummaryItem[]>>({});
  const [activeTab, setActiveTab] = useState<'assets' | 'calendar'>('assets');
  
  // Loading unlock data for all portfolios
  useEffect(() => {
    const fetchUnlockSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await apiService.getUnlocksSummary();
        
        if (data && data.summary && data.unlocks) {
          setSummary(data.summary);
          setUnlockData(data.unlocks);
          
          // Group data by portfolios
          const grouped = data.unlocks.reduce<Record<string, PortfolioUnlockSummaryItem[]>>((acc, item) => {
            if (!acc[item.portfolio_id]) {
              acc[item.portfolio_id] = [];
            }
            acc[item.portfolio_id].push(item);
            return acc;
          }, {});
          
          setGroupedByPortfolio(grouped);
        } else {
          console.error('Unexpected data structure:', data);
          setError('Received invalid data structure from API');
        }
      } catch (err) {
        console.error('Error fetching unlock summary:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load unlock summary';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUnlockSummary();
  }, []);
  
  // Asset click handling
  const handleAssetClick = (assetId: string) => {
    WebApp.HapticFeedback.impactOccurred('light');
    navigate(`/portfolio/asset/${assetId}`);
  };
  
  // Portfolio click handling
  const handlePortfolioClick = (portfolioId: string) => {
    WebApp.HapticFeedback.impactOccurred('light');
    navigate(`/portfolio/${portfolioId}/unlocks`);
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
        <button 
          className={styles.retryButton}
          onClick={() => {
            WebApp.HapticFeedback.impactOccurred('light');
            setLoading(true);
            // Data reload
            window.location.reload();
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (unlockData.length === 0) {
    return (
      <div className={styles.noData}>
        <p>No unlock information available across portfolios.</p>
        <button 
          className={styles.backButton}
          onClick={() => {
            WebApp.HapticFeedback.impactOccurred('light');
            navigate('/portfolio');
          }}
        >
          Back to Portfolios
        </button>
      </div>
    );
  }

  // Function for displaying the unlock calendar
  const renderCalendarView = () => {
    // Collecting all unlocks into a single array
    const allAllocations: Array<{
      portfolio_id: string;
      portfolio_name: string;
      asset_id: string;
      asset_name: string;
      logo?: string;
      unlock_date: string;
      amount: number;
      percent_of_total: number;
      is_cliff: boolean;
      is_tge: boolean;
    }> = [];
    
    // For each asset, get its unlocks
    unlockData.forEach(item => {
      if (item.unlock && item.unlock.allocations) {
        item.unlock.allocations.forEach(allocation => {
          allAllocations.push({
            portfolio_id: item.portfolio_id,
            portfolio_name: item.portfolio_name,
            asset_id: item.asset_id,
            asset_name: item.asset_name,
            logo: item.logo,
            unlock_date: allocation.unlock_date,
            amount: allocation.amount,
            percent_of_total: allocation.percent_of_total,
            is_cliff: allocation.is_cliff,
            is_tge: allocation.is_tge
          });
        });
      }
    });
    
    // Sort by date
    allAllocations.sort((a, b) => new Date(a.unlock_date).getTime() - new Date(b.unlock_date).getTime());
    
    if (allAllocations.length === 0) {
      return (
        <div className={styles.noData}>
          <p>No unlock data available to display in the calendar.</p>
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
                  <div 
                    key={`${allocation.asset_id}-${index}`} 
                    className={styles.calendarItem}
                    onClick={() => handleAssetClick(allocation.asset_id)}
                  >
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
                        <div>
                          <span className={styles.assetName}>{allocation.asset_name}</span>
                          <span className={styles.portfolioName}>{allocation.portfolio_name}</span>
                        </div>
                      </div>
                      <div className={styles.unlockDate}>
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
          
          {summary.portfolio_count !== undefined && summary.asset_count !== undefined && (
            <div className={styles.statsRow}>
              <div className={styles.statsItem}>
                <span className={styles.statsLabel}>Portfolios</span>
                <span className={styles.statsValue}>{summary.portfolio_count}</span>
              </div>
              <div className={styles.statsItem}>
                <span className={styles.statsLabel}>Assets</span>
                <span className={styles.statsValue}>{summary.asset_count}</span>
              </div>
            </div>
          )}
          
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
    { id: 'calendar', label: 'Calendar' }
  ];
  
  const handleTabChange = (tabId: string) => {
    WebApp.HapticFeedback.impactOccurred('light');
    setActiveTab(tabId as 'assets' | 'calendar');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Token Unlocks</h1>
      </div>
      
      <div className={styles.summaryContent}>
        <p className={styles.description}>
          Upcoming token unlocks in all portfolios
        </p>
        
        {summary && renderSummary()}
        
        <TabsComponent 
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
        
        {activeTab === 'calendar' ? (
          renderCalendarView()
        ) : (
          <>
            {Object.entries(groupedByPortfolio).map(([portfolioId, items]) => (
              <div key={portfolioId} className={styles.portfolioSection}>
                <div 
                  className={styles.portfolioHeader}
                  onClick={() => handlePortfolioClick(portfolioId)}
                >
                  <h2 className={styles.portfolioName}>{items[0]?.portfolio_name || 'Portfolio'}</h2>
                  <span className={styles.assetCount}>{items.length} assets</span>
                </div>
                
                <div className={styles.assetsList}>
                  {items.map((item) => (
                    <div 
                      key={item.asset_id} 
                      className={styles.assetCard}
                      onClick={() => handleAssetClick(item.asset_id)}
                    >
                      <div className={styles.assetHeader}>
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
                        <div className={styles.assetInfo}>
                          <h3 className={styles.assetName}>{item.asset_name}</h3>
                          <span className={styles.unlockType}>{item.unlock?.unlock_type ? formatUnlockType(item.unlock.unlock_type) : 'Unknown type'}</span>
                        </div>
                      </div>
                      
                      <div className={styles.unlockInfo}>
                        {item.unlock ? (
                          <>
                            <div className={styles.infoRow}>
                              <span className={styles.infoLabel}>Vesting period</span>
                              <span className={styles.infoValue}>
                                {formatDate(item.unlock.start_date)} - {formatDate(item.unlock.end_date)}
                              </span>
                            </div>
                            
                            {item.unlock.cliff_date && (
                              <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Cliff date</span>
                                <span className={styles.infoValue}>{formatDate(item.unlock.cliff_date)}</span>
                              </div>
                            )}
                            
                            {item.unlock.tge_percent && (
                              <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>TGE (%)</span>
                                <span className={styles.infoValue}>{item.unlock.tge_percent}%</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Status</span>
                            <span className={styles.infoValue}>No unlock data available</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default PortfolioUnlockSummaryScreen; 