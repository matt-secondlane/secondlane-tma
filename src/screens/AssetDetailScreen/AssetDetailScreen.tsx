import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { apiService } from '../../utils/api';
import { AssetSummary, PortfolioAssetUnlock, PortfolioAssetUnlockAllocation } from '../../types/api';
import { Loader } from '../../components/Loader';
import AssetGraph from '../../components/AssetGraph/AssetGraph';
import { formatMoney } from '../../utils/money';
import styles from './AssetDetailScreen.module.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  BarController,
  LineController,
} from 'chart.js';

// Register necessary Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  Title,
  Tooltip,
  Legend
);

// Date formatting for unlocks
const formatUnlockDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Percentage formatting
const formatPercent = (value?: number): string => {
  if (value === undefined || value === null) return '0%';
  return `${value.toFixed(2)}%`;
};

// Number formatting with abbreviations for large numbers
const formatNumberWithAbbr = (value?: number): string => {
  if (value === undefined || value === null) return '0';
  
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  } else if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  } else if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  
  return value.toLocaleString();
};

// Convert project unlock data to portfolio asset unlock format
const convertProjectUnlockToAssetUnlock = (projectUnlock: {
  unlock_type: string;
  vesting_start_date: string;
  vesting_end_date: string;
  listing_date: string;
  total_supply: number;
  total_locked: number;
  total_unlocked: number;
  next_unlock_date: string;
  allocations?: Array<{
    tge_unlock: number;
    tge_unlock_percent: number;
    next_unlock_tokens: number;
    next_unlock_date: string;
  }>;
}): PortfolioAssetUnlock => {
  const allocations: PortfolioAssetUnlockAllocation[] = [];
  
  if (projectUnlock.allocations && projectUnlock.allocations.length > 0) {
    projectUnlock.allocations.forEach((allocation) => {
      // TGE allocation
      if (allocation.tge_unlock > 0) {
        allocations.push({
          unlock_date: projectUnlock.listing_date,
          amount: allocation.tge_unlock,
          percent_of_total: allocation.tge_unlock_percent * 100,
          is_cliff: false,
          is_tge: true
        });
      }
      
      // Next unlock
      if (allocation.next_unlock_tokens > 0 && allocation.next_unlock_date) {
        allocations.push({
          unlock_date: allocation.next_unlock_date,
          amount: allocation.next_unlock_tokens,
          percent_of_total: (allocation.next_unlock_tokens / projectUnlock.total_supply) * 100,
          is_cliff: false,
          is_tge: false
        });
      }
    });
  }
  
  return {
    unlock_type: projectUnlock.unlock_type,
    start_date: projectUnlock.vesting_start_date,
    end_date: projectUnlock.vesting_end_date,
    total_amount: projectUnlock.total_supply,
    summary: {
      total_amount_locked: projectUnlock.total_locked,
      total_amount_unlocked: projectUnlock.total_unlocked,
      unlocked_percent: (projectUnlock.total_unlocked / projectUnlock.total_supply) * 100,
      locked_percent: (projectUnlock.total_locked / projectUnlock.total_supply) * 100,
      next_unlock_date: projectUnlock.next_unlock_date
    },
    allocations: allocations.length > 0 ? allocations : undefined
  };
};

const AssetDetailScreen: React.FC = () => {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assetData, setAssetData] = useState<AssetSummary | null>(null);
  const [unlockData, setUnlockData] = useState<PortfolioAssetUnlock | null>(null);
  const [unlockLoading, setUnlockLoading] = useState(false);

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
        
        if (data.unlock) {
          setUnlockData(data.unlock);
        } else if (data.project?.project_id) {
          // If there's no unlock data in the asset, fetch it from the project
          setUnlockLoading(true);
          try {
            const unlockResponse = await apiService.getProjectUnlocks(data.project.project_id);
            
            if (unlockResponse?.unlock) {
              const assetUnlock = convertProjectUnlockToAssetUnlock(unlockResponse.unlock);
              setUnlockData(assetUnlock);
            }
          } catch (unlockErr) {
            console.error('Error fetching project unlock data:', unlockErr);
          } finally {
            setUnlockLoading(false);
          }
        }
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
    WebApp.HapticFeedback.impactOccurred('light');
    navigate(-1);
  };
  
  // Render asset summary section
  const renderAssetSummary = () => (
    <section className={styles.summarySection}>
      <div className={styles.summaryCard}>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Current Value:</span>
          <span className={styles.summaryValue}>
            {formatMoney(assetData!.current_value)}
          </span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Invested:</span>
          <span className={styles.summaryValue}>
            {formatMoney(assetData!.invested_amount)}
          </span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Profit/Loss:</span>
          <span className={`${styles.summaryValue} ${assetData!.gain_loss_usd >= 0 ? styles.positive : styles.negative}`}>
            {assetData!.gain_loss_usd >= 0 ? '+' : ''}
            {formatMoney(assetData!.gain_loss_usd)}
          </span>
        </div>
        {assetData!.equity_or_tokens_amount !== undefined && (
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Equity/Tokens:</span>
            <span className={styles.summaryValue}>
              {typeof assetData!.equity_or_tokens_amount === 'number' && assetData!.equity_or_tokens_amount < 1 
                ? `${(assetData!.equity_or_tokens_amount * 100).toFixed(2)}%` 
                : assetData!.equity_or_tokens_amount}
            </span>
          </div>
        )}
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>ROI:</span>
          <span className={`${styles.summaryValue} ${(assetData!.gain_loss_percentage || 0) >= 0 ? styles.positive : styles.negative}`}>
            {assetData!.gain_loss_percentage !== null && assetData!.gain_loss_percentage !== undefined ? 
              `${assetData!.gain_loss_percentage >= 0 ? '+' : ''}${assetData!.gain_loss_percentage.toFixed(2)}%` : 
              '0.00%'
            }
          </span>
        </div>
      </div>
    </section>
  );

  // Render unlock information summary
  const renderUnlockSummary = () => (
    <section className={styles.unlockSection}>
      <h2 className={styles.sectionTitle}>Token Unlocks</h2>
      
      {unlockData && (
        <div className={styles.unlockSummary}>
          <div className={styles.unlockRow}>
            <span className={styles.unlockLabel}>Unlock type:</span>
            <span className={styles.unlockValue}>
              {unlockData.unlock_type 
                ? unlockData.unlock_type.charAt(0).toUpperCase() + unlockData.unlock_type.slice(1) 
                : 'Unknown'}
            </span>
          </div>
          <div className={styles.unlockRow}>
            <span className={styles.unlockLabel}>Vesting period:</span>
            <span className={styles.unlockValue}>
              {formatUnlockDate(unlockData.start_date)} - {formatUnlockDate(unlockData.end_date)}
            </span>
          </div>
          {unlockData.cliff_date && (
            <div className={styles.unlockRow}>
              <span className={styles.unlockLabel}>Cliff date:</span>
              <span className={styles.unlockValue}>{formatUnlockDate(unlockData.cliff_date)}</span>
            </div>
          )}
          {unlockData.tge_percent !== undefined && (
            <div className={styles.unlockRow}>
              <span className={styles.unlockLabel}>TGE unlock:</span>
              <span className={styles.unlockValue}>{formatPercent(unlockData.tge_percent)}</span>
            </div>
          )}
          {unlockData.total_amount !== undefined && (
            <div className={styles.unlockRow}>
              <span className={styles.unlockLabel}>Total amount:</span>
              <span className={styles.unlockValue}>{formatNumberWithAbbr(unlockData.total_amount)}</span>
            </div>
          )}
          
          {unlockData.summary && (
            <div className={styles.unlockStatusContainer}>
              <div className={styles.unlockStatus}>
                <div className={styles.unlockStatusItem}>
                  <span className={styles.unlockStatusLabel}>Unlocked</span>
                  <span className={styles.unlockStatusValue}>
                    {formatNumberWithAbbr(unlockData.summary.total_amount_unlocked)} 
                    ({formatPercent(unlockData.summary.unlocked_percent)})
                  </span>
                </div>
                <div className={styles.unlockStatusItem}>
                  <span className={styles.unlockStatusLabel}>Locked</span>
                  <span className={styles.unlockStatusValue}>
                    {formatNumberWithAbbr(unlockData.summary.total_amount_locked)} 
                    ({formatPercent(unlockData.summary.locked_percent)})
                  </span>
                </div>
              </div>
              
              {unlockData.summary.next_unlock_date && (
                <div className={styles.nextUnlock}>
                  <span className={styles.nextUnlockLabel}>Next unlock:</span>
                  <span className={styles.nextUnlockDate}>
                    {formatUnlockDate(unlockData.summary.next_unlock_date)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {!unlockData && !unlockLoading && (
        <div className={styles.noDataMessage}>
          <p>No unlock data available for this asset</p>
        </div>
      )}
    </section>
  );

  // Render unlock chart
  const renderUnlockChart = () => {
    if (!unlockData?.summary) {
      return null;
    }
    
    const { total_amount_unlocked, total_amount_locked, unlocked_percent } = unlockData.summary;
    const totalTokens = total_amount_unlocked + total_amount_locked;
    
    if (totalTokens <= 0) {
      return null;
    }
    
    return (
      <section className={styles.unlockChartSection}>
        <h2 className={styles.sectionTitle}>Unlock Progress</h2>
        <div className={styles.unlockChartContainer}>
          <div className={styles.progressChartContainer}>
            <div className={styles.progressCircleWrapper}>
              <div className={styles.progressCircle}>
                <svg width="160" height="160" viewBox="0 0 160 160">
                  <defs>
                    <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFA726" />
                      <stop offset="100%" stopColor="#FF7043" />
                    </linearGradient>
                    <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#2196F3" />
                      <stop offset="100%" stopColor="#00B0FF" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="url(#orangeGradient)"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="url(#blueGradient)"
                    strokeWidth="12"
                    strokeDasharray={`${2 * Math.PI * 70 * (unlocked_percent / 100)} ${2 * Math.PI * 70}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    transform="rotate(-90 80 80)"
                  />
                </svg>
                <div className={styles.progressCircleContent}>
                  <div className={styles.tokenValue}>{formatNumberWithAbbr(totalTokens)}</div>
                  <div className={styles.tokenLabel}>out of {unlockData.total_amount ? formatNumberWithAbbr(unlockData.total_amount) : 'Total'}</div>
                </div>
              </div>
            </div>
            <div className={styles.progressLegend}>
              <div className={styles.legendItem}>
                <div className={styles.legendColorUnlocked}></div>
                <div className={styles.legendText}>
                  <div className={styles.legendTitle}>Unlocked</div>
                  <div className={styles.legendValue}>{formatPercent(unlocked_percent)}</div>
                </div>
              </div>
              <div className={styles.legendItem}>
                <div className={styles.legendColorLocked}></div>
                <div className={styles.legendText}>
                  <div className={styles.legendTitle}>Locked</div>
                  <div className={styles.legendValue}>{formatPercent(100 - unlocked_percent)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  // Render unlock allocations timeline
  const renderUnlockTimeline = () => {
    if (!unlockData?.allocations || unlockData.allocations.length === 0) {
      return null;
    }
    
    return (
      <section className={styles.allocationsSection}>
        <h2 className={styles.sectionTitle}>Unlock Schedule</h2>
        <div className={styles.unlockAllocations}>
          <div className={styles.unlockTimeline}>
            {unlockData.allocations
              .sort((a, b) => new Date(a.unlock_date).getTime() - new Date(b.unlock_date).getTime())
              .map((allocation: PortfolioAssetUnlockAllocation, index: number) => (
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
                        <span className={styles.allocationValue}>{formatNumberWithAbbr(allocation.amount)}</span>
                      </div>
                      <div className={styles.allocationRow}>
                        <span className={styles.allocationLabel}>Percent of total:</span>
                        <span className={styles.allocationValue}>{formatPercent(allocation.percent_of_total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>
    );
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
        {renderAssetSummary()}

        <section className={styles.graphSection}>
          <h2 className={styles.sectionTitle}>Value History</h2>
          {assetId && <AssetGraph assetId={assetId} />}
        </section>
        
        {/* Unlock Section */}
        {unlockLoading ? (
          <section className={styles.unlockSection}>
            <h2 className={styles.sectionTitle}>Token Unlocks</h2>
            <div className={styles.loaderContainer} style={{ height: 'auto', padding: '32px 0' }}>
              <Loader />
            </div>
          </section>
        ) : (
          <>
            {renderUnlockSummary()}
            {renderUnlockChart()}
            {renderUnlockTimeline()}
          </>
        )}
      </div>
    </div>
  );
};

export default AssetDetailScreen; 