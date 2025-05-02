import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../utils/api';
import { AssetSummary, PortfolioAssetUnlockAllocation } from '../../types/api';
import { Loader } from '../../components/Loader';
import AssetGraph from '../../components/AssetGraph/AssetGraph';
import { formatMoney } from '../../utils/money';
import styles from './AssetDetailScreen.module.css';

// Date formatting for unlocks
const formatUnlockDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Percentage formatting
const formatPercent = (value?: number): string => {
  if (value === undefined || value === null) return '0%';
  return `${value}%`;
};

// Number formatting with separators
const formatNumber = (value?: number): string => {
  if (value === undefined || value === null) return '0';
  return value.toLocaleString();
};

const AssetDetailScreen: React.FC = () => {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assetData, setAssetData] = useState<AssetSummary | null>(null);

  useEffect(() => {
    const fetchAssetData = async () => {
      if (!assetId) {
        setError('Asset ID not specified');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const data = await apiService.getAssetSummary(assetId);
        setAssetData(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load asset data';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchAssetData();
  }, [assetId]);

  const handleBackClick = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <Loader />
      </div>
    );
  }

  if (error || !assetData) {
    return (
      <div className={styles.errorContainer}>
        <button 
          className={styles.backButton}
          onClick={handleBackClick}
        >
          ←
        </button>
        <h1 className={styles.errorTitle}>Error</h1>
        <p className={styles.errorMessage}>{error || 'Failed to load asset data'}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={handleBackClick}
        >
          ←
        </button>
        <div className={styles.headerContent}>
          <div className={styles.projectInfo}>
            {assetData.project.logo && (
              <img 
                src={assetData.project.logo} 
                alt={assetData.project.name} 
                className={styles.projectLogo}
              />
            )}
            <h1 className={styles.projectName}>{assetData.project.name}</h1>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <section className={styles.summarySection}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Current Value:</span>
              <span className={styles.summaryValue}>
                {formatMoney(assetData.current_value)}
              </span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Invested:</span>
              <span className={styles.summaryValue}>
                {formatMoney(assetData.invested_amount)}
              </span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Profit/Loss:</span>
              <span className={`${styles.summaryValue} ${assetData.gain_loss_usd >= 0 ? styles.positive : styles.negative}`}>
                {assetData.gain_loss_usd >= 0 ? '+' : ''}
                {formatMoney(assetData.gain_loss_usd)}
              </span>
            </div>
            {assetData.equity_or_tokens_amount !== undefined && (
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Equity/Tokens:</span>
                <span className={styles.summaryValue}>
                  {typeof assetData.equity_or_tokens_amount === 'number' && assetData.equity_or_tokens_amount < 1 
                    ? `${(assetData.equity_or_tokens_amount * 100).toFixed(2)}%` 
                    : assetData.equity_or_tokens_amount}
                </span>
              </div>
            )}
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>ROI:</span>
              <span className={`${styles.summaryValue} ${(assetData.gain_loss_percentage || 0) >= 0 ? styles.positive : styles.negative}`}>
                {assetData.gain_loss_percentage !== null && assetData.gain_loss_percentage !== undefined ? 
                  `${assetData.gain_loss_percentage >= 0 ? '+' : ''}${assetData.gain_loss_percentage.toFixed(2)}%` : 
                  '0.00%'
                }
              </span>
            </div>
          </div>
        </section>

        <section className={styles.graphSection}>
          <h2 className={styles.sectionTitle}>Value History</h2>
          {assetId && <AssetGraph assetId={assetId} />}
        </section>
        
        {/* Unlock Section */}
        {assetData.unlock && (
          <section className={styles.unlockSection}>
            <h2 className={styles.sectionTitle}>Token Unlock</h2>
            <div className={styles.unlockCard}>
              <div className={styles.unlockHeader}>
                <div className={styles.unlockRow}>
                  <span className={styles.unlockLabel}>Unlock Type:</span>
                  <span className={styles.unlockValue}>{assetData.unlock.unlock_type || 'Unknown'}</span>
                </div>
                <div className={styles.unlockRow}>
                  <span className={styles.unlockLabel}>Vesting Period:</span>
                  <span className={styles.unlockValue}>
                    {formatUnlockDate(assetData.unlock.start_date)} - {formatUnlockDate(assetData.unlock.end_date)}
                  </span>
                </div>
                {assetData.unlock.cliff_date && (
                  <div className={styles.unlockRow}>
                    <span className={styles.unlockLabel}>Cliff Date:</span>
                    <span className={styles.unlockValue}>{formatUnlockDate(assetData.unlock.cliff_date)}</span>
                  </div>
                )}
                {assetData.unlock.tge_percent !== undefined && (
                  <div className={styles.unlockRow}>
                    <span className={styles.unlockLabel}>TGE Unlock:</span>
                    <span className={styles.unlockValue}>{formatPercent(assetData.unlock.tge_percent)}</span>
                  </div>
                )}
                {assetData.unlock.total_amount !== undefined && (
                  <div className={styles.unlockRow}>
                    <span className={styles.unlockLabel}>Total Amount:</span>
                    <span className={styles.unlockValue}>{formatNumber(assetData.unlock.total_amount)}</span>
                  </div>
                )}
              </div>
              
              {assetData.unlock.allocations && assetData.unlock.allocations.length > 0 && (
                <div className={styles.unlockAllocations}>
                  <h3 className={styles.unlockSubtitle}>Unlock Schedule</h3>
                  <div className={styles.unlockTimeline}>
                    {assetData.unlock.allocations.map((allocation: PortfolioAssetUnlockAllocation, index: number) => (
                      <div key={index} className={styles.allocationItem}>
                        <div className={styles.allocationMarker} />
                        <div className={styles.allocationCard}>
                          <div className={styles.allocationHeader}>
                            <span className={styles.allocationTitle}>
                              {formatUnlockDate(allocation.unlock_date)}
                              {allocation.is_cliff && <span className={styles.cliffBadge}>Cliff</span>}
                              {allocation.is_tge && <span className={styles.tgeBadge}>TGE</span>}
                            </span>
                          </div>
                          <div className={styles.allocationDetails}>
                            <div className={styles.allocationRow}>
                              <span className={styles.allocationLabel}>Amount:</span>
                              <span className={styles.allocationValue}>{formatNumber(allocation.amount)}</span>
                            </div>
                            <div className={styles.allocationRow}>
                              <span className={styles.allocationLabel}>Percent of Total:</span>
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
          </section>
        )}
      </div>
    </div>
  );
};

export default AssetDetailScreen; 