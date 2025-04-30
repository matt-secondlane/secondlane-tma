import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { apiService } from '../../../utils/api';
import { PortfolioUnlockSummaryItem } from '../../../types/api';
import { Loader } from '../../../components/Loader';
import styles from './PortfolioUnlockSummaryScreen.module.css';

// Date formatting
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const PortfolioUnlockSummaryScreen: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unlockData, setUnlockData] = useState<PortfolioUnlockSummaryItem[]>([]);
  const [groupedByPortfolio, setGroupedByPortfolio] = useState<Record<string, PortfolioUnlockSummaryItem[]>>({});
  
  // Loading unlock data for all portfolios
  useEffect(() => {
    const fetchUnlockSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await apiService.getUnlocksSummary();
        setUnlockData(data);
        
        // Group data by portfolios
        const grouped = data.reduce<Record<string, PortfolioUnlockSummaryItem[]>>((acc, item) => {
          if (!acc[item.portfolio_id]) {
            acc[item.portfolio_id] = [];
          }
          acc[item.portfolio_id].push(item);
          return acc;
        }, {});
        
        setGroupedByPortfolio(grouped);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load unlock summary';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUnlockSummary();
  }, []);
  
  // Asset click handling
  const handleAssetClick = (assetId: string) => {
    WebApp.HapticFeedback.impactOccurred('light');
    navigate(`/portfolio/asset/${assetId}`);
  };
  
  // Portfolio click handling
  const handlePortfolioClick = (portfolioId: string) => {
    WebApp.HapticFeedback.impactOccurred('light');
    navigate(`/portfolio/${portfolioId}/unlocks`);
  };

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <Loader />
        <p>Loading unlock information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={() => {
            WebApp.HapticFeedback.impactOccurred('light');
            setLoading(true);
            // Data reload
            window.location.reload();
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (unlockData.length === 0) {
    return (
      <div className={styles.noData}>
        <p>No unlock information available across portfolios.</p>
        <button 
          className={styles.backButton}
          onClick={() => {
            WebApp.HapticFeedback.impactOccurred('light');
            navigate('/portfolio');
          }}
        >
          Back to Portfolios
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={() => {
            WebApp.HapticFeedback.impactOccurred('light');
            navigate('/portfolio');
          }}
        >
          ←
        </button>
        <h1 className={styles.title}>Token Unlocks</h1>
      </div>
      
      <div className={styles.summaryContent}>
        <p className={styles.description}>
          Upcoming token unlocks across all portfolios
        </p>
        
        {Object.entries(groupedByPortfolio).map(([portfolioId, items]) => (
          <div key={portfolioId} className={styles.portfolioSection}>
            <div 
              className={styles.portfolioHeader}
              onClick={() => handlePortfolioClick(portfolioId)}
            >
              <h2 className={styles.portfolioName}>{items[0]?.portfolio_name || 'Portfolio'}</h2>
              <span className={styles.assetCount}>{items.length} assets</span>
            </div>
            
            <div className={styles.assetsList}>
              {items.map((item) => (
                <div 
                  key={item.asset_id} 
                  className={styles.assetCard}
                  onClick={() => handleAssetClick(item.asset_id)}
                >
                  <div className={styles.assetHeader}>
                    {item.logo ? (
                      <img 
                        src={item.logo} 
                        alt={item.asset_name} 
                        className={styles.assetLogo}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/40?text=' + item.asset_name.charAt(0);
                        }}
                      />
                    ) : (
                      <div className={styles.assetLogoPlaceholder}>
                        {item.asset_name.charAt(0)}
                      </div>
                    )}
                    <div className={styles.assetInfo}>
                      <h3 className={styles.assetName}>{item.asset_name}</h3>
                      <span className={styles.unlockType}>{item.unlock.unlock_type}</span>
                    </div>
                  </div>
                  
                  <div className={styles.unlockInfo}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Vesting Period</span>
                      <span className={styles.infoValue}>
                        {formatDate(item.unlock.start_date)} - {formatDate(item.unlock.end_date)}
                      </span>
                    </div>
                    
                    {item.unlock.cliff_date && (
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Cliff Date</span>
                        <span className={styles.infoValue}>{formatDate(item.unlock.cliff_date)}</span>
                      </div>
                    )}
                    
                    {item.unlock.tge_percent !== undefined && (
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>TGE (%)</span>
                        <span className={styles.infoValue}>{item.unlock.tge_percent}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PortfolioUnlockSummaryScreen; 