import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import styles from './PieChartUnlocks.module.css';

// Array of colors for pie chart sectors
const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', 
  '#00c49f', '#ffbb28', '#ff8042', '#a4de6c', '#d0ed57',
  '#9E77ED', '#F04438', '#6941C6', '#7A5AF8', '#9E77ED',
  '#FEC84B', '#FDB022', '#F79009', '#DC6803', '#B54708',
  '#00C5E5', '#06AED4', '#00B8D9', '#0052CC', '#0747A6'
];

interface ProjectAllocation {
  name: string;
  tokens: number;
  allocation_of_supply: number;
  unlock_type?: string;
  tge_unlock?: number;
  tge_unlock_percent?: number;
  next_unlock_date?: string;
  next_unlock_tokens?: number;
}

interface PieChartUnlocksProps {
  allocations: ProjectAllocation[];
}

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

export const PieChartUnlocks: React.FC<PieChartUnlocksProps> = ({ allocations }) => {
  // Filter allocations with data and prepare data for pie chart
  const chartData = allocations
    .filter(item => item.tokens > 0)
    .map(item => ({
      name: item.name,
      value: item.tokens,
      percentage: item.allocation_of_supply,
      unlockType: item.unlock_type
    }))
    .sort((a, b) => b.value - a.value); // Sort from largest to smallest

  if (chartData.length === 0) {
    return (
      <div className={styles.noDataMessage}>
        <p>No data available for the chart</p>
      </div>
    );
  }

  // Calculate total value to show percentage in tooltip
  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          activeIndex={[]}
          isAnimationActive={true}
          animationBegin={0}
          animationDuration={600}
        >
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => {
            const numValue = typeof value === 'number' ? value : 0;
            const percentage = (numValue / totalValue) * 100;
            return [
              `${formatNumber(numValue)} (${formatPercent(percentage)})`,
              name
            ];
          }}
          contentStyle={{
            backgroundColor: 'var(--tg-theme-bg-color)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            padding: '8px 12px'
          }}
        />
        <Legend 
          formatter={(value, entry) => {
            if (entry && entry.payload && 'name' in entry.payload) {
              return entry.payload.name;
            }
            return value;
          }}
          layout="vertical"
          verticalAlign="middle"
          align="right"
          wrapperStyle={{ fontSize: '12px', padding: '0 20px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default PieChartUnlocks; 