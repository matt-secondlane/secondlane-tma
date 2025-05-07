import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { apiService } from '../../utils/api';
import { AssetSummary, PortfolioAssetUnlockAllocation } from '../../types/api';
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
  Title,
  Tooltip,
  Legend,
  TooltipItem
} from 'chart.js';
import TabsComponent, { TabItem } from '../../components/TabsComponent/TabsComponent';

// Register necessary Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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

type UnlockTab = 'allocations' | 'calendar';

const AssetDetailScreen: React.FC = () => {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assetData, setAssetData] = useState<AssetSummary | null>(null);
  const [activeTab, setActiveTab] = useState<UnlockTab>('allocations');

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
    WebApp.HapticFeedback.impactOccurred('light');
    navigate(-1);
  };
  
  const handleTabChange = (tabId: string) => {
    WebApp.HapticFeedback.impactOccurred('light');
    setActiveTab(tabId as UnlockTab);
  };

  // Tabs for unlocks
  const unlockTabs: TabItem[] = [
    { id: 'allocations', label: 'Allocations' },
    { id: 'calendar', label: 'Calendar' }
  ];

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
            <h2 className={styles.sectionTitle}>Token Unlocks</h2>
            
            {/* General unlock information */}
            <div className={styles.unlockSummary}>
              <div className={styles.unlockRow}>
                <span className={styles.unlockLabel}>Unlock type:</span>
                <span className={styles.unlockValue}>{assetData.unlock.unlock_type || 'Unknown'}</span>
              </div>
              <div className={styles.unlockRow}>
                <span className={styles.unlockLabel}>Vesting period:</span>
                <span className={styles.unlockValue}>
                  {formatUnlockDate(assetData.unlock.start_date)} - {formatUnlockDate(assetData.unlock.end_date)}
                </span>
              </div>
              {assetData.unlock.cliff_date && (
                <div className={styles.unlockRow}>
                  <span className={styles.unlockLabel}>Cliff date:</span>
                  <span className={styles.unlockValue}>{formatUnlockDate(assetData.unlock.cliff_date)}</span>
                </div>
              )}
              {assetData.unlock.tge_percent !== undefined && (
                <div className={styles.unlockRow}>
                  <span className={styles.unlockLabel}>TGE unlock:</span>
                  <span className={styles.unlockValue}>{formatPercent(assetData.unlock.tge_percent)}</span>
                </div>
              )}
              {assetData.unlock.total_amount !== undefined && (
                <div className={styles.unlockRow}>
                  <span className={styles.unlockLabel}>Total amount:</span>
                  <span className={styles.unlockValue}>{formatNumber(assetData.unlock.total_amount)}</span>
                </div>
              )}
              
              {/* Information about unlocked/locked tokens */}
              {assetData.unlock.summary && (
                <div className={styles.unlockStatusContainer}>
                  <div className={styles.unlockStatus}>
                    <div className={styles.unlockStatusItem}>
                      <span className={styles.unlockStatusLabel}>Unlocked</span>
                      <span className={styles.unlockStatusValue}>
                        {formatNumber(assetData.unlock.summary.total_amount_unlocked)} 
                        ({formatPercent(assetData.unlock.summary.unlocked_percent)})
                      </span>
                    </div>
                    <div className={styles.unlockStatusItem}>
                      <span className={styles.unlockStatusLabel}>Locked</span>
                      <span className={styles.unlockStatusValue}>
                        {formatNumber(assetData.unlock.summary.total_amount_locked)} 
                        ({formatPercent(assetData.unlock.summary.locked_percent)})
                      </span>
                    </div>
                  </div>
                  
                  {assetData.unlock.summary.next_unlock_date && (
                    <div className={styles.nextUnlock}>
                      <span className={styles.nextUnlockLabel}>Next unlock:</span>
                      <span className={styles.nextUnlockDate}>
                        {formatUnlockDate(assetData.unlock.summary.next_unlock_date)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Tabs for unlocks */}
            {assetData.unlock.allocations && assetData.unlock.allocations.length > 0 && (
              <div className={styles.unlockTabs}>
                <TabsComponent 
                  tabs={unlockTabs}
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                  containerClassname={styles.tabsContainer}
                  tabClassname={styles.tabButton}
                  activeTabClassname={styles.activeTab}
                />
                
                {/* Allocations tab content */}
                {activeTab === 'allocations' && (
                  <div className={styles.unlockAllocations}>
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
                                <span className={styles.allocationLabel}>Percent of total:</span>
                                <span className={styles.allocationValue}>{formatPercent(allocation.percent_of_total)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Calendar tab content */}
                {activeTab === 'calendar' && (
                  <div className={styles.calendarView}>
                    {/* Monthly unlock chart */}
                    <div className={styles.unlockChartContainer}>
                      <h3 className={styles.chartTitle}>Monthly Unlock Chart</h3>
                      <div className={styles.chartWrapper}>
                        {(() => {
                          // Grouping by months for the chart
                          const monthlyData: Record<string, { amount: number, cumulativeAmount: number }> = {};
                          let cumulativeTotal = 0;
                          
                          // Sort allocations by date
                          const sortedAllocations = [...(assetData.unlock.allocations || [])].sort((a, b) => {
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
                          const labels = sortedMonths.map(monthKey => {
                            const [year, month] = monthKey.split('-');
                            return new Date(parseInt(year), parseInt(month) - 1, 1)
                              .toLocaleString('ru-RU', { month: 'short', year: 'numeric' });
                          });
                          
                          const monthlyAmounts = sortedMonths.map(month => monthlyData[month].amount);
                          const cumulativeAmounts = sortedMonths.map(month => monthlyData[month].cumulativeAmount);
                          
                          const chartData = {
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
                          
                          const chartOptions = {
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
                              },
                            },
                            plugins: {
                              tooltip: {
                                callbacks: {
                                  label: function(context: TooltipItem<'bar' | 'line'>) {
                                    const label = context.dataset.label || '';
                                    const value = context.raw || 0;
                                    return `${label}: ${formatNumber(value as number)}`;
                                  }
                                }
                              }
                            }
                          };
                          
                          if (sortedMonths.length === 0) {
                            return (
                              <div className={styles.noDataMessage}>
                                <p>No monthly unlock data available</p>
                              </div>
                            );
                          }
                          
                          return (
                            <Chart 
                              type='bar'
                              data={chartData} 
                              options={chartOptions}
                            />
                          );
                        })()}
                      </div>
                    </div>
                    
                    {/* Group unlocks by month */}
                    {(() => {
                      // Grouping by months
                      const groupedByMonth: Record<string, PortfolioAssetUnlockAllocation[]> = {};
                      
                      assetData.unlock.allocations?.forEach(allocation => {
                        const date = new Date(allocation.unlock_date);
                        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        
                        if (!groupedByMonth[monthKey]) {
                          groupedByMonth[monthKey] = [];
                        }
                        
                        groupedByMonth[monthKey].push(allocation);
                      });
                      
                      // Sort by date
                      const sortedMonths = Object.keys(groupedByMonth).sort();
                      
                      return sortedMonths.map(monthKey => {
                        const [year, month] = monthKey.split('-');
                        const monthName = new Date(parseInt(year), parseInt(month) - 1, 1)
                          .toLocaleString('en-US', { month: 'long', year: 'numeric' });
                        
                        return (
                          <div key={monthKey} className={styles.monthGroup}>
                            <h3 className={styles.monthTitle}>{monthName}</h3>
                            <div className={styles.monthAllocations}>
                              {groupedByMonth[monthKey].map((allocation, index) => (
                                <div key={index} className={styles.calendarItem}>
                                  <div className={styles.calendarItemHeader}>
                                    <div className={styles.unlockDate}>
                                      {formatUnlockDate(allocation.unlock_date)}
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
                      });
                    })()} 
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default AssetDetailScreen; 