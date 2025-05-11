import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { apiService } from '../../utils/api';
import { AssetSummary, PortfolioAssetUnlock, PortfolioAssetUnlockAllocation } from '../../types/api';
import { Loader } from '../../components/Loader';
import AssetGraph from '../../components/AssetGraph/AssetGraph';
import { formatMoney } from '../../utils/money';
import styles from './AssetDetailScreen.module.css';
import { Chart } from 'react-chartjs-2';
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
  TooltipItem,
} from 'chart.js';

// Register necessary Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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

// Chart options factory
const getChartOptions = () => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      type: 'linear' as const,
      display: true,
      position: 'left' as const,
      title: {
        display: true,
        text: 'Unlocked per month',
      },
      ticks: {
        callback: function(tickValue: number | string) {
          const numericValue = typeof tickValue === 'string' ? parseFloat(tickValue) : tickValue;
          if (isNaN(numericValue as number)) return tickValue;
          return formatNumberWithAbbr(numericValue as number);
        }
      }
    },
    y1: {
      type: 'linear' as const,
      display: true,
      position: 'right' as const,
      title: {
        display: true,
        text: 'Total amount',
      },
      grid: {
        drawOnChartArea: false,
      },
      ticks: {
        callback: function(tickValue: number | string) {
          const numericValue = typeof tickValue === 'string' ? parseFloat(tickValue) : tickValue;
          if (isNaN(numericValue as number)) return tickValue;
          return formatNumberWithAbbr(numericValue as number);
        }
      }
    },
  },
  plugins: {
    tooltip: {
      callbacks: {
        label: function(context: TooltipItem<'bar' | 'line'>) {
          const label = context.dataset.label || '';
          const value = context.raw || 0;
          return `${label}: ${formatNumberWithAbbr(value as number)}`;
        }
      }
    }
  }
});

const AssetDetailScreen: React.FC = () => {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assetData, setAssetData] = useState<AssetSummary | null>(null);
  const [unlockData, setUnlockData] = useState<PortfolioAssetUnlock | null>(null);
  const [unlockLoading, setUnlockLoading] = useState(false);

  // Pre-compute chart options
  const chartOptions = useMemo(() => getChartOptions(), []);

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
  
  // Generate chart data from unlock allocations
  const generateChartData = (allocations: PortfolioAssetUnlockAllocation[]) => {
    try {
      // Group by months
      const monthlyData: Record<string, { amount: number, cumulativeAmount: number }> = {};
      let cumulativeTotal = 0;
      
      // Sort allocations by date
      const sortedAllocations = [...allocations].sort((a, b) => {
        return new Date(a.unlock_date).getTime() - new Date(b.unlock_date).getTime();
      });
      
      // Group by months and calculate cumulative sums
      sortedAllocations.forEach(allocation => {
        const date = new Date(allocation.unlock_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { amount: 0, cumulativeAmount: 0 };
        }
        
        monthlyData[monthKey].amount += allocation.amount;
        cumulativeTotal += allocation.amount;
        monthlyData[monthKey].cumulativeAmount = cumulativeTotal;
      });
      
      // Prepare data for the chart
      const sortedMonths = Object.keys(monthlyData).sort();
      
      if (sortedMonths.length === 0) {
        return null;
      }
      
      const labels = sortedMonths.map(monthKey => {
        const [year, month] = monthKey.split('-');
        return new Date(parseInt(year), parseInt(month) - 1, 1)
          .toLocaleString('en-US', { month: 'short', year: 'numeric' });
      });
      
      const monthlyAmounts = sortedMonths.map(month => monthlyData[month].amount);
      const cumulativeAmounts = sortedMonths.map(month => monthlyData[month].cumulativeAmount);
      
      return {
        labels,
        datasets: [
          {
            label: 'Unlocked per month',
            data: monthlyAmounts,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            type: 'bar' as const,
            yAxisID: 'y',
          },
          {
            label: 'Total unlock amount',
            data: cumulativeAmounts,
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2,
            type: 'line' as const,
            yAxisID: 'y1',
          },
        ],
      };
    } catch (error) {
      console.error('Error generating chart data:', error);
      return null;
    }
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
    if (!unlockData?.allocations || unlockData.allocations.length === 0) {
      return null;
    }
    
    const chartData = generateChartData(unlockData.allocations);
    
    if (!chartData) {
      return null;
    }
    
    return (
      <section className={styles.unlockChartSection}>
        <h2 className={styles.sectionTitle}>Unlock Chart</h2>
        <div className={styles.unlockChartContainer}>
          <div className={styles.chartWrapper}>
            <Chart 
              type='bar'
              data={chartData} 
              options={chartOptions}
              height={300}
              key={`unlock-chart-${assetId}`}
            />
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