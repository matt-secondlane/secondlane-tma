import React, { useState, useEffect } from 'react';
import { apiService } from '../../utils/api';
import { PortfolioAssetUnlockItem } from '../../types/api';
import { Loader } from '../Loader';
import styles from './PortfolioUnlocks.module.css';

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
  return value.toLocaleString();
};

// Percentage formatting
const formatPercent = (value?: number): string => {
  if (value === undefined || value === null) return '0%';
  return `${value}%`;
};

export const PortfolioUnlocks: React.FC<PortfolioUnlocksProps> = ({ portfolioId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unlocks, setUnlocks] = useState<PortfolioAssetUnlockItem[]>([]);
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);

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
        
        const unlocksData = await apiService.getPortfolioUnlocks(portfolioId);
        console.log('Unlocks data received:', unlocksData);
        
        // Check data for correctness
        const validUnlocks = unlocksData.filter(item => item && item.asset_id && item.asset_name);
        console.log('Valid unlocks:', validUnlocks);
        
        setUnlocks(validUnlocks);
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

  return (
    <div className={styles.unlocksContainer}>
      <h2 className={styles.sectionTitle}>Token Unlocks</h2>
      <p className={styles.description}>
        Token unlock schedule for assets in this portfolio
      </p>

      {!hasUnlockData && (
        <div className={styles.noUnlockData}>
          <p>No unlock data available for the assets in this portfolio.</p>
          <p className={styles.smallText}>Unlock information will be displayed here once available from the token issuers.</p>
        </div>
      )}

      <div className={styles.unlocksList}>
        {unlocks.map((item) => (
          <div 
            key={item.asset_id} 
            className={`${styles.unlockItem} ${expandedAssetId === item.asset_id ? styles.expanded : ''}`}
            onClick={() => handleAssetClick(item.asset_id)}
          >
            <div className={styles.unlockItemHeader}>
              <div className={styles.assetInfo}>
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
                  
                  {item.unlock.tge_percent !== undefined && (
                    <div className={styles.unlockSummaryItem}>
                      <span className={styles.itemLabel}>TGE Unlock</span>
                      <span className={styles.itemValue}>{formatPercent(item.unlock.tge_percent)}</span>
                    </div>
                  )}
                  
                  {item.unlock.total_amount !== undefined && (
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
    </div>
  );
};

export default PortfolioUnlocks; 