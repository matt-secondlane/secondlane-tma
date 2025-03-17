import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { useTelegram } from '../../../hooks/useTelegram';
import { apiService } from '../../../utils/api';
import { Portfolio, PortfolioAsset } from '../../../types/api';
import styles from './PortfolioDetailScreen.module.css';
import { Loader } from '../../../components/Loader';

export const PortfolioDetailScreen: React.FC = () => {
  const navigate = useNavigate();
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const { isReady, webApp } = useTelegram();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [portfolioAssets, setPortfolioAssets] = useState<PortfolioAsset[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch portfolio details
  const fetchPortfolioDetails = useCallback(async () => {
    if (!portfolioId) {
      setError('Portfolio ID is missing');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const [portfolioDetails, assets] = await Promise.all([
        apiService.getPortfolioById(portfolioId),
        apiService.getPortfolioAssets(portfolioId)
      ]);
      
      setPortfolio(portfolioDetails);
      setPortfolioAssets(assets);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load portfolio details: ${errorMessage}. Please try again.`);
    } finally {
      setLoading(false);
    }
  }, [portfolioId]);

  // Initialize
  useEffect(() => {
    if (isReady) {
      WebApp.ready();
      fetchPortfolioDetails();
    }
  }, [isReady, fetchPortfolioDetails]);

  // Handle file upload for CSV
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !portfolioId) {
      return;
    }
    
    setIsUploading(true);
    webApp?.HapticFeedback.impactOccurred('medium');
    
    try {
      await apiService.uploadPortfolioAssetsCSV(portfolioId, file);
      WebApp.showAlert('CSV uploaded successfully!');
      webApp?.HapticFeedback.notificationOccurred('success');
      
      // Refresh assets
      fetchPortfolioDetails();
    } catch {
      WebApp.showAlert('Error uploading CSV. Please try again.');
      webApp?.HapticFeedback.notificationOccurred('error');
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // Handle create asset button click
  const handleCreateAssetClick = () => {
    if (!portfolioId) return;
    webApp?.HapticFeedback.impactOccurred('light');
    navigate(`/portfolio/${portfolioId}/create-asset`);
  };

  // Handle edit asset
  const handleEditAsset = (assetId: string) => {
    if (!portfolioId) return;
    webApp?.HapticFeedback.impactOccurred('light');
    navigate(`/portfolio/${portfolioId}/edit-asset/${assetId}`);
  };

  // Handle delete asset
  const handleDeleteAsset = async (assetId: string) => {
    if (!portfolioId) return;
    
    WebApp.showConfirm(
      'Are you sure you want to delete this asset? This action cannot be undone.',
      async (confirmed) => {
        if (confirmed) {
          try {
            setLoading(true);
            await apiService.deletePortfolioAsset(portfolioId, assetId);
            
            // Update assets list
            setPortfolioAssets(prev => prev.filter(a => a.asset_id !== assetId));
            webApp?.HapticFeedback.notificationOccurred('success');
          } catch {
            WebApp.showAlert('Failed to delete asset. Please try again.');
            webApp?.HapticFeedback.notificationOccurred('error');
          } finally {
            setLoading(false);
          }
        }
      }
    );
  };

  // Format currency
  const formatCurrency = (value: number | string | undefined): string => {
    if (value === undefined || value === null) {
      return '$0.00';
    }
    
    // Convert string to number if it's a string
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numValue)) {
      return '$0.00';
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue);
  };

  // Format date
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) {
      return 'N/A';
    }
    
    // Try to parse different date formats
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // If parsing failed, try other formats
      
      // Try to parse YYYY-MM-DD format
      if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      
      return dateString; // Return original string if parsing failed
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <Loader />
        <p>Loading portfolio details...</p>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className={styles.errorContainer}>
        <h2>Portfolio Not Found</h2>
        <p>The portfolio you are looking for does not exist or you don't have permission to view it.</p>
        <button 
          className={styles.backButton}
          onClick={() => navigate('/portfolio')}
        >
          Back to Portfolios
        </button>
      </div>
    );
  }

  return (
    <div className={styles.portfolioDetailScreen}>
      <div className={styles.portfolioDetailHeader}>
        <div className={styles.headerTop}>
          <button 
            className={styles.backButton}
            onClick={() => {
              webApp?.HapticFeedback.impactOccurred('light');
              navigate('/portfolio');
            }}
          >
            ←
          </button>
          <h1 className={styles.screenTitle}>{portfolio.name}</h1>
        </div>
        {portfolio.description && (
          <p className={styles.portfolioDescription}>{portfolio.description}</p>
        )}
      </div>

      {error && (
        <div className={styles.error}>
          {error}
          <button 
            className={styles.retryButton}
            onClick={() => {
              webApp?.HapticFeedback.impactOccurred('light');
              fetchPortfolioDetails();
            }}
          >
            Retry
          </button>
        </div>
      )}

      <div className={styles.portfolioContent}>
        <div className={styles.assetsHeader}>
          <h2>Portfolio Assets</h2>
          <div className={styles.assetsActions}>
            <label className={styles.fileUpload}>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              {isUploading ? (
                <>
                  <span className={styles.loadingSpinner} />
                  Uploading...
                </>
              ) : (
                <>
                  Upload CSV
                </>
              )}
            </label>
            <button 
              className={styles.addAssetBtn}
              onClick={() => {
                webApp?.HapticFeedback.impactOccurred('light');
                handleCreateAssetClick();
              }}
            >
              Add Asset
            </button>
          </div>
        </div>

        {portfolioAssets.length === 0 ? (
          <div className={styles.noAssets}>
            <p>No assets in this portfolio yet</p>
            <button 
              className={styles.addFirstAssetBtn}
              onClick={() => {
                webApp?.HapticFeedback.impactOccurred('light');
                handleCreateAssetClick();
              }}
            >
              Add Your First Asset
            </button>
          </div>
        ) : (
          <div className={styles.assetsList}>
            {portfolioAssets.map((asset) => (
              <div key={asset.asset_id} className={styles.assetItem}>
                <div className={styles.assetHeader}>
                  <div className={styles.assetInfo}>
                    {asset.logo ? (
                      <img 
                        src={asset.logo} 
                        alt={asset.project_name} 
                        className={styles.assetLogo}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/40?text=' + asset.project_name.charAt(0);
                        }}
                      />
                    ) : (
                      <div className={styles.assetLogo} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: '#f0f0f0',
                        color: '#333',
                        fontSize: '20px',
                        fontWeight: 'bold'
                      }}>
                        {asset.project_name.charAt(0)}
                      </div>
                    )}
                    <h3>{asset.project_name}</h3>
                  </div>
                  <div className={styles.assetActions}>
                    <button 
                      className={styles.editAssetBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        webApp?.HapticFeedback.impactOccurred('light');
                        handleEditAsset(asset.asset_id);
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      className={styles.deleteAssetBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        webApp?.HapticFeedback.impactOccurred('medium');
                        handleDeleteAsset(asset.asset_id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className={styles.assetDetails}>
                  <div className={styles.assetDetail}>
                    <span className={styles.detailLabel}>Date</span>
                    <span className={styles.detailValue}>
                      {asset.date ? formatDate(asset.date) : formatDate(asset.created_at)}
                    </span>
                  </div>
                  <div className={styles.assetDetail}>
                    <span className={styles.detailLabel}>Invested Amount</span>
                    <span className={styles.detailValue}>
                      {formatCurrency(asset.tranche_size || asset.invested_amount || 0)}
                    </span>
                  </div>
                  {(asset.valuation || asset.valuation === 0) && (
                    <div className={styles.assetDetail}>
                      <span className={styles.detailLabel}>Valuation</span>
                      <span className={styles.detailValue}>{formatCurrency(asset.valuation)}</span>
                    </div>
                  )}
                  {(asset.equity_or_tokens_amount || asset.equity_or_tokens_amount === 0) && (
                    <div className={styles.assetDetail}>
                      <span className={styles.detailLabel}>Equity/Tokens</span>
                      <span className={styles.detailValue}>{asset.equity_or_tokens_amount}</span>
                    </div>
                  )}
                  {asset.terms && (
                    <div className={styles.assetDetail}>
                      <span className={styles.detailLabel}>Terms</span>
                      <span className={styles.detailValue}>{asset.terms}</span>
                    </div>
                  )}
                  {asset.project_website && (
                    <div className={styles.assetDetail}>
                      <span className={styles.detailLabel}>Website</span>
                      <a 
                        href={asset.project_website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={styles.websiteLink}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {asset.project_website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioDetailScreen; 