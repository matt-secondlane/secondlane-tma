import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { apiService } from '../../utils/api';
import { PortfolioGraphDataPoint } from '../../types/api';
import { Loader } from '../Loader';
import { formatMoney } from '../../utils/money';
import styles from './PortfolioGraph.module.css';

interface PortfolioGraphProps {
  portfolioId?: string; // If provided, shows the graph for a specific portfolio
}

export const PortfolioGraph: React.FC<PortfolioGraphProps> = ({ portfolioId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<PortfolioGraphDataPoint[]>([]);

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        setLoading(true);
        
        const response = portfolioId 
          ? await apiService.getPortfolioGraphById(portfolioId)
          : await apiService.getPortfolioGraph();
        
        if (response.data && response.data.monthly_values) {
          setChartData(response.data.monthly_values);
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

  return (
    <div className={styles.graphContainer}>
      <div className={styles.graphHeader}>
        <h2 className={styles.graphTitle}>Portfolio Value History</h2>
      </div>
      
      <div className={styles.graphWrapper}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
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
              tickFormatter={(value) => formatMoney(value)}
              tick={{ fontSize: 12 }}
              width={60}
            />
            <Tooltip 
              formatter={(value: number, name: string) => {
                const labels: {[key: string]: string} = {
                  total_value: 'Current Value',
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
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="total_value" 
              name="Current Value"
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
            <Line 
              type="monotone" 
              dataKey="gain_loss_percentage" 
              name="ROI, %"
              stroke="#5856d6" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
              hide={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PortfolioGraph; 