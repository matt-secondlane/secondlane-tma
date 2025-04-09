import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { apiService } from '../../utils/api';
import { PortfolioGraphDataPoint } from '../../types/api';
import { Loader } from '../Loader';
import { formatMoney } from '../../utils/money';
import styles from './AssetGraph.module.css';

interface AssetGraphProps {
  assetId: string;
}

export const AssetGraph: React.FC<AssetGraphProps> = ({ assetId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<PortfolioGraphDataPoint[]>([]);
  const [projectName, setProjectName] = useState('');
  const [projectLogo, setProjectLogo] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        setLoading(true);
        
        const response = await apiService.getAssetGraph(assetId);
        
        setChartData(response.data.monthly_values);
        setProjectName(response.data.project.name);
        setProjectLogo(response.data.project.logo);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error loading asset graph data';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchGraphData();
  }, [assetId]);

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

  if (!chartData || !chartData.length) {
    return (
      <div className={styles.noDataContainer}>
        <p className={styles.noDataMessage}>No data available for the chart</p>
      </div>
    );
  }

  return (
    <div className={styles.graphContainer}>
      <div className={styles.graphHeader}>
        <div className={styles.projectInfo}>
          {projectLogo && (
            <img 
              src={projectLogo} 
              alt={projectName} 
              className={styles.projectLogo}
            />
          )}
          <h2 className={styles.graphTitle}>{projectName} - Value History</h2>
        </div>
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
                  gain_loss_usd: 'Profit/Loss'
                };
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
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AssetGraph; 