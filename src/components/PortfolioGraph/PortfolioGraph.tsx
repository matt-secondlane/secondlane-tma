import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area
} from 'recharts';
import { apiService } from '../../utils/api';
import { PortfolioGraphDataPoint } from '../../types/api';
import { Loader } from '../Loader';
import { formatMoney } from '../../utils/money';
import styles from './PortfolioGraph.module.css';

// Array of colors for stacked chart
const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', 
  '#00c49f', '#ffbb28', '#ff8042', '#a4de6c', '#d0ed57',
  '#9E77ED', '#F04438', '#6941C6', '#7A5AF8', '#9E77ED',
  '#FEC84B', '#FDB022', '#F79009', '#DC6803', '#B54708',
  '#00C5E5', '#06AED4', '#00B8D9', '#0052CC', '#0747A6'
];

interface PortfolioGraphProps {
  portfolioId?: string; // If provided, shows the graph for a specific portfolio
}

export const PortfolioGraph: React.FC<PortfolioGraphProps> = ({ portfolioId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<PortfolioGraphDataPoint[]>([]);
  const [assetNames, setAssetNames] = useState<Record<string, string>>({});
  const [activeTooltip, setActiveTooltip] = useState<boolean>(false);

  // Chart click handler to hide tooltip
  const handleChartClick = () => {
    // Hide tooltip when clicking on the chart
    setActiveTooltip(false);
  };

  // Add document click handler to hide tooltip when clicking outside the chart
  useEffect(() => {
    // Function to hide tooltip
    const handleDocumentClick = () => {
      if (activeTooltip) {
        setActiveTooltip(false);
      }
    };

    // Add handler globally to the entire page
    document.addEventListener('click', handleDocumentClick);
    
    // Clean up the handler when component unmounts
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [activeTooltip]);

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        setLoading(true);
        
        const response = portfolioId 
          ? await apiService.getPortfolioGraphById(portfolioId)
          : await apiService.getPortfolioGraph();
        
        if (response.data && response.data.monthly_values) {
          setChartData(response.data.monthly_values);
          
          // Collect asset names from the graph data
          const assetNamesMap: Record<string, string> = {};
          
          response.data.monthly_values.forEach(dataPoint => {
            if (dataPoint.assets && dataPoint.assets.length > 0) {
              dataPoint.assets.forEach(asset => {
                if (asset.asset_id && !assetNamesMap[asset.asset_id] && asset.name) {
                  assetNamesMap[asset.asset_id] = asset.name;
                }
              });
            }
          });
          
          setAssetNames(assetNamesMap);
        } else {
          setError('Invalid data format from API');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error loading graph data';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchGraphData();
  }, [portfolioId]);

  const formatDate = (dateString: string) => {
    // Format in API: "2023-01" (year-month)
    const [year, month] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  };

  // Function to get all unique asset IDs from all chart data points
  const getUniqueAssetIds = () => {
    const assetIds = new Set<string>();
    
    // Collect all unique asset IDs from all chart data points
    chartData.forEach(dataPoint => {
      if (dataPoint.assets && dataPoint.assets.length > 0) {
        dataPoint.assets.forEach(asset => {
          assetIds.add(asset.asset_id);
        });
      }
    });
    
    return Array.from(assetIds);
  };

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <Loader />
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

  if (!chartData.length) {
    return (
      <div className={styles.noDataContainer}>
        <p className={styles.noDataMessage}>No data available for the chart</p>
      </div>
    );
  }

  // Get all unique asset IDs
  const uniqueAssetIds = getUniqueAssetIds();
  // Check if there are assets to display
  const hasAssets = uniqueAssetIds.length > 0;

  return (
    <div className={styles.graphContainer}>
      <div className={styles.graphHeader}>
        <h2 className={styles.graphTitle}>Portfolio Value vs Total Invested</h2>
      </div>
      
      <div className={styles.graphWrapper}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
            onClick={handleChartClick}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
              tickMargin={10}
            />
            <YAxis 
              tickFormatter={(value) => formatMoney(value)}
              tick={{ fontSize: 12 }}
              width={60}
            />
            <Tooltip 
              formatter={(value: number, name: string) => {
                const labels: {[key: string]: string} = {
                  total_value: 'Portfolio Value',
                  total_invested: 'Total Invested',
                  gain_loss_usd: 'Profit/Loss',
                  gain_loss_percentage: 'ROI, %'
                };
                if (name === 'gain_loss_percentage') {
                  return [`${value.toFixed(2)}%`, labels[name]];
                }
                return [formatMoney(value), labels[name] || name];
              }}
              labelFormatter={formatDate}
              contentStyle={{
                backgroundColor: 'var(--tg-theme-bg-color)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                padding: '8px 12px'
              }}
              position={{ x: 0, y: 0 }}
              wrapperStyle={{ zIndex: 1000, position: 'absolute', top: 0 }}
              allowEscapeViewBox={{ x: true, y: true }}
              content={({ active, payload, label }) => {
                // Update tooltip active state
                if (active !== activeTooltip) {
                  setActiveTooltip(!!active);
                }
                
                if (active && payload && payload.length) {
                  const dataPoint = chartData.find(point => point.date === label);
                  if (!dataPoint) return null;

                  return (
                    <div className={styles.tooltipContent}>
                      <p className={styles.tooltipDate}>{formatDate(label)}</p>
                      {payload.map((entry: { name?: string; value?: number; color?: string }, index: number) => (
                        <p key={index} style={{ color: entry.color || '#000' }}>
                          {entry.name}: {entry.name === 'gain_loss_percentage' 
                            ? `${entry.value?.toFixed(2)}%` 
                            : formatMoney(entry.value || 0)}
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="total_value" 
              name="Portfolio Value"
              stroke="#4cd964" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="total_invested" 
              name="Total Invested"
              stroke="#007aff" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="gain_loss_usd" 
              name="Profit/Loss"
              stroke="#ff9500" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
            {/* <Line 
              type="monotone" 
              dataKey="gain_loss_percentage" 
              name="ROI, %"
              stroke="#5856d6" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            /> */}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Only display bottom chart if there are assets */}
      {hasAssets && (
        <>
          <div className={styles.graphHeader} style={{ marginTop: '12px' }}>
            <h2 className={styles.graphTitle}>Asset Composition Over Time</h2>
          </div>
          
          <div className={styles.graphWrapper}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                onClick={handleChartClick}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate} 
                  tick={{ fontSize: 12 }}
                  tickMargin={10}
                />
                <YAxis 
                  tickFormatter={(value) => formatMoney(value)}
                  tick={{ fontSize: 12 }}
                  width={60}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    // Special handling for "Other Assets"
                    if (name === 'asset_value_other') {
                      return [formatMoney(value), 'Other Assets'];
                    }
                    
                    // Find asset ID from datakey name (format: asset_value_[asset_id])
                    const assetIdMatch = name.match(/asset_value_(.+)/);
                    if (assetIdMatch && assetIdMatch[1]) {
                      const assetId = assetIdMatch[1];
                      return [formatMoney(value), assetNames[assetId] || `Project ${uniqueAssetIds.indexOf(assetId) + 1}`];
                    }
                    return [formatMoney(value), name];
                  }}
                  labelFormatter={formatDate}
                  contentStyle={{
                    backgroundColor: 'var(--tg-theme-bg-color)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                  position={{ x: 0, y: 0 }}
                  wrapperStyle={{ zIndex: 1000, position: 'absolute', top: 0 }}
                  allowEscapeViewBox={{ x: true, y: true }}
                />
                <Legend
                  formatter={(value: string) => {
                    // Special handling for "Other Assets"
                    if (value === 'asset_value_other') {
                      return 'Other Assets';
                    }
                    
                    // Find asset ID from datakey name
                    const assetIdMatch = value.match(/asset_value_(.+)/);
                    if (assetIdMatch && assetIdMatch[1]) {
                      const assetId = assetIdMatch[1];
                      // If asset name exists, use it, otherwise use "Project X"
                      return assetNames[assetId] || `Project ${uniqueAssetIds.indexOf(assetId) + 1}`;
                    }
                    return value;
                  }}
                  iconSize={10}
                  wrapperStyle={{ fontSize: '12px' }}
                  verticalAlign="bottom"
                  layout="horizontal"
                  margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                />
                {uniqueAssetIds.slice(0, 10).map((assetId, index) => (
                  <Area
                    key={assetId}
                    type="monotone"
                    dataKey={(item: PortfolioGraphDataPoint) => {
                      const asset = item.assets?.find(a => a.asset_id === assetId);
                      return asset ? asset.value : 0;
                    }}
                    name={`asset_value_${assetId}`}
                    stackId="1"
                    stroke={COLORS[index % COLORS.length]}
                    fill={COLORS[index % COLORS.length]}
                    strokeWidth={1.5}
                    strokeOpacity={0.8}
                    fillOpacity={0.7}
                  />
                ))}
                {uniqueAssetIds.length > 10 && (
                  <Area
                    key="other-assets"
                    type="monotone"
                    dataKey={(item: PortfolioGraphDataPoint) => {
                      let total = 0;
                      const otherAssetIds = uniqueAssetIds.slice(10);
                      otherAssetIds.forEach(assetId => {
                        const asset = item.assets?.find(a => a.asset_id === assetId);
                        if (asset) {
                          total += asset.value || 0;
                        }
                      });
                      return total;
                    }}
                    name="asset_value_other"
                    stackId="1"
                    stroke="#999999"
                    fill="#999999"
                    strokeWidth={1.5}
                    strokeOpacity={0.8}
                    fillOpacity={0.7}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default PortfolioGraph; 