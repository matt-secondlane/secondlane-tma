import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../utils/api';
import { AssetSummary } from '../../types/api';
import { Loader } from '../../components/Loader';
import AssetGraph from '../../components/AssetGraph/AssetGraph';
import { formatMoney } from '../../utils/money';
import styles from './AssetDetailScreen.module.css';

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
                    ? `${assetData.equity_or_tokens_amount.toFixed(2)}%` 
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
      </div>
    </div>
  );
};

export default AssetDetailScreen; 