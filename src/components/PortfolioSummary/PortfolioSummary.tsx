import React, { useState, useEffect } from 'react';
import { apiService } from '../../utils/api';
import { PortfolioSummary as PortfolioSummaryType, AssetSummary } from '../../types/api';
import { Loader } from '../Loader';
import { formatMoney } from '../../utils/money';
import styles from './PortfolioSummary.module.css';

interface PortfolioSummaryProps {
  portfolioId?: string; // If provided, shows summary for a specific portfolio
}

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ portfolioId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<PortfolioSummaryType | null>(null);
  const [assets, setAssets] = useState<AssetSummary[]>([]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        
        // Get general summary or summary for a specific portfolio
        const summaryData = portfolioId 
          ? await apiService.getPortfolioSummaryById(portfolioId)
          : await apiService.getPortfolioSummary();
        
        console.log('Raw summary data:', JSON.stringify(summaryData));
        setSummary(summaryData);
        
        // Get assets from API response
        if (summaryData.assets && summaryData.assets.length > 0) {
          console.log('Setting assets from summary:', summaryData.assets.length);
          setAssets(summaryData.assets);
        } else {
          console.log('No assets in summary data');
          // Если активы не получены из summary, сделаем дополнительный запрос
          try {
            if (portfolioId) {
              const portfolioAssets = await apiService.getPortfolioAssets(portfolioId);
              if (portfolioAssets && portfolioAssets.length > 0) {
                console.log('Received assets from additional request:', portfolioAssets.length);
                // Преобразуем формат если нужно
                const formattedAssets = portfolioAssets.map(asset => ({
                  asset_id: asset.asset_id,
                  project: {
                    project_id: asset.project_id || '',
                    name: asset.project_name,
                    logo: asset.logo
                  },
                  invested_amount: asset.invested_amount || 0,
                  current_value: asset.valuation || 0,
                  project_valuation: asset.valuation || 0,
                  previous_valuation: 0,
                  gain_loss_usd: 0,
                  gain_loss_percentage: 0,
                  valuation_source: '',
                  date: asset.date || ''
                }));
                setAssets(formattedAssets);
              }
            }
          } catch (assetError) {
            console.error('Error loading additional assets:', assetError);
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error loading data';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [portfolioId]);

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

  if (!summary) {
    return (
      <div className={styles.noDataContainer}>
        <p className={styles.noDataMessage}>No data available</p>
      </div>
    );
  }

  return (
    <div className={styles.summaryContainer}>
      <div className={styles.summaryHeader}>
        <h2 className={styles.summaryTitle}>General Information</h2>
      </div>
      
      <div className={styles.summaryCard}>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Total Value:</span>
          <span className={styles.summaryValue}>{formatMoney(summary.total_current_value)}</span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Total Invested:</span>
          <span className={styles.summaryValue}>{formatMoney(summary.total_invested_amount)}</span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>ROI:</span>
          <span className={`${styles.summaryValue} ${(summary.total_gain_loss_percentage || 0) >= 0 ? styles.positive : styles.negative}`}>
            {summary.total_gain_loss_percentage !== null && summary.total_gain_loss_percentage !== undefined ? 
              `${summary.total_gain_loss_percentage >= 0 ? '+' : ''}${summary.total_gain_loss_percentage.toFixed(2)}%` : 
              '0.00%'
            }
          </span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Profit/Loss:</span>
          <span className={`${styles.summaryValue} ${summary.total_gain_loss_usd >= 0 ? styles.positive : styles.negative}`}>
            {summary.total_gain_loss_usd >= 0 ? '+' : ''}{formatMoney(summary.total_gain_loss_usd)}
          </span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Number of Assets:</span>
          <span className={styles.summaryValue}>{summary.total_assets}</span>
        </div>
      </div>

      {assets.length > 0 && (
        <>
          <div className={styles.assetsHeader}>
            <h2 className={styles.assetsTitle}>Assets</h2>
          </div>
          <div className={styles.assetsList}>
            <div className={styles.assetHeader}>
              <span>Name</span>
              <span style={{textAlign: 'right'}}>Invested</span>
              <span style={{textAlign: 'right'}}>Value</span>
              <span style={{textAlign: 'right'}}>ROI</span>
            </div>
            {assets.map(asset => (
              <div 
                key={asset.asset_id} 
                className={styles.assetItem}
              >
                <div className={styles.assetInfo}>
                  {asset.project.logo && (
                    <img src={asset.project.logo} alt={asset.project.name} className={styles.assetLogo} />
                  )}
                  <span className={styles.assetName}>{asset.project.name}</span>
                </div>
                <span className={styles.assetAmount}>{formatMoney(asset.invested_amount)}</span>
                <span className={styles.assetValue}>{formatMoney(asset.current_value)}</span>
                <span className={`${styles.assetRoi} ${(asset.gain_loss_percentage || 0) >= 0 ? styles.positive : styles.negative}`}>
                  {asset.gain_loss_percentage !== null && asset.gain_loss_percentage !== undefined ? 
                    `${asset.gain_loss_percentage >= 0 ? '+' : ''}${asset.gain_loss_percentage.toFixed(2)}%` : 
                    '0.00%'
                  }
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PortfolioSummary; 