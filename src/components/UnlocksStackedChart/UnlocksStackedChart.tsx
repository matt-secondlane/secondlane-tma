import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PortfolioAssetUnlockItem } from '../../types/api';
import styles from './UnlocksStackedChart.module.css';

// Array of colors for stacked chart
const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', 
  '#00c49f', '#ffbb28', '#ff8042', '#a4de6c', '#d0ed57',
  '#9E77ED', '#F04438', '#6941C6', '#7A5AF8', '#9E77ED',
  '#FEC84B', '#FDB022', '#F79009', '#DC6803', '#B54708',
  '#00C5E5', '#06AED4', '#00B8D9', '#0052CC', '#0747A6'
];

interface UnlocksStackedChartProps {
  unlocks: PortfolioAssetUnlockItem[];
}

// Number formatting
const formatNumber = (value?: number): string => {
  if (value === undefined || value === null) return '0';
  if (value >= 1000000) {
    return (value / 1000000).toFixed(2) + ' mil';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + ' k';
  }
  return Math.round(value).toLocaleString('en-US');
};

// Date formatting
const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short'
  });
};

export const UnlocksStackedChart: React.FC<UnlocksStackedChartProps> = ({ unlocks }) => {
  // Process data for the chart
  // Filter unlocks with data and allocations
  const unlocksWithAllocations = unlocks.filter(item => 
    item.unlock && 
    item.unlock.allocations && 
    item.unlock.allocations.length > 0
  );

  if (unlocksWithAllocations.length === 0) {
    return (
      <div className={styles.noDataMessage}>
        <p>No unlock data available for the chart</p>
      </div>
    );
  }

  // Collect all allocations with dates
  const allAllocations: {
    asset_id: string;
    asset_name: string;
    date: string;
    amount: number;
  }[] = [];

  unlocksWithAllocations.forEach(asset => {
    if (asset.unlock && asset.unlock.allocations) {
      asset.unlock.allocations.forEach(allocation => {
        allAllocations.push({
          asset_id: asset.asset_id,
          asset_name: asset.asset_name,
          date: allocation.unlock_date,
          amount: allocation.amount || 0
        });
      });
    }
  });

  // Sort allocations by date
  allAllocations.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Get unique dates for the chart
  const uniqueDates = [...new Set(allAllocations.map(item => item.date))].sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  // Get unique asset IDs for the chart
  const uniqueAssetIds = [...new Set(allAllocations.map(item => item.asset_id))];
  const assetNames: Record<string, string> = {};
  uniqueAssetIds.forEach(assetId => {
    const asset = unlocks.find(item => item.asset_id === assetId);
    if (asset) {
      assetNames[assetId] = asset.asset_name;
    }
  });

  // Create chart data with cumulative values for each asset
  const chartData = uniqueDates.map(date => {
    // Base object with date
    const dataPoint: Record<string, string | number> = { date };
    
    // Calculate cumulative values for each asset up to this date
    uniqueAssetIds.forEach(assetId => {
      const relevantAllocations = allAllocations.filter(
        allocation => 
          allocation.asset_id === assetId && 
          new Date(allocation.date).getTime() <= new Date(date).getTime()
      );
      
      const totalAmount = relevantAllocations.reduce((sum, allocation) => sum + allocation.amount, 0);
      dataPoint[assetId] = totalAmount;
    });
    
    return dataPoint;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart
        data={chartData}
        margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatDate} 
          tick={{ fontSize: 12 }}
          tickMargin={10}
        />
        <YAxis 
          tickFormatter={(value) => formatNumber(value)}
          tick={{ fontSize: 12 }}
          width={60}
        />
        <Tooltip 
          formatter={(value: number, name: string) => {
            return [formatNumber(value), assetNames[name] || name];
          }}
          labelFormatter={(label) => `Date: ${formatDate(label as string)}`}
          contentStyle={{
            backgroundColor: 'var(--tg-theme-bg-color)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            padding: '8px 12px'
          }}
        />
        <Legend
          formatter={(value: string) => {
            return assetNames[value] || value;
          }}
          iconSize={10}
          wrapperStyle={{ fontSize: '12px' }}
          verticalAlign="bottom"
          layout="horizontal"
          margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
        />
        {uniqueAssetIds.map((assetId, index) => (
          <Area
            key={assetId}
            type="monotone"
            dataKey={assetId}
            name={assetId}
            stackId="1"
            stroke={COLORS[index % COLORS.length]}
            fill={COLORS[index % COLORS.length]}
            strokeWidth={1.5}
            strokeOpacity={0.8}
            fillOpacity={0.7}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default UnlocksStackedChart; 