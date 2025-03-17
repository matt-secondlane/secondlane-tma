import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { useTelegram } from '../../../hooks/useTelegram';
import { apiService } from '../../../utils/api';
import { Portfolio } from '../../../types/api';
import styles from './PortfolioScreen.module.css';
import { Loader } from '../../../components/Loader';

interface EnhancedPortfolio extends Portfolio {
  assetsCount?: number;
}

export const PortfolioScreen: React.FC = () => {
  const navigate = useNavigate();
  const { isReady, webApp } = useTelegram();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portfolios, setPortfolios] = useState<EnhancedPortfolio[]>([]);
  const [isCreatingPortfolio, setIsCreatingPortfolio] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');

  // Fetch portfolios
  const fetchPortfolios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching portfolios...');
      const fetchedPortfolios = await apiService.getPortfolios();
      console.log('Fetched portfolios:', fetchedPortfolios);
      
      if (fetchedPortfolios.length === 0) {
        // Create default portfolio if none exists
        console.log('No portfolios found, creating default portfolio...');
        try {
          const defaultPortfolio = await apiService.createPortfolio({
            name: 'My Portfolio'
          });
          console.log('Created default portfolio:', defaultPortfolio);
          setPortfolios([defaultPortfolio]);
        } catch (createError) {
          console.error('Error creating default portfolio:', createError);
          const errorMessage = createError instanceof Error ? createError.message : 'Unknown error';
          setError(`Failed to create default portfolio: ${errorMessage}. Please try again.`);
        }
      } else {
        // Получаем количество активов для каждого портфолио
        const enhancedPortfolios = await Promise.all(
          fetchedPortfolios.map(async (portfolio) => {
            try {
              const assets = await apiService.getPortfolioAssets(portfolio.portfolio_id);
              return {
                ...portfolio,
                assetsCount: assets.length
              };
            } catch (err) {
              console.error(`Error fetching assets for portfolio ${portfolio.portfolio_id}:`, err);
              return {
                ...portfolio,
                assetsCount: 0
              };
            }
          })
        );
        
        setPortfolios(enhancedPortfolios);
      }
    } catch (err) {
      console.error('Error fetching portfolios:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load portfolios: ${errorMessage}. Please try again.`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize
  useEffect(() => {
    if (isReady) {
      WebApp.ready();
      console.log('WebApp is ready, fetching portfolios...');
      fetchPortfolios().catch(err => {
        console.error('Error in initial portfolio fetch:', err);
        setError(`Failed to initialize: ${err instanceof Error ? err.message : 'Unknown error'}`);
      });
    } else {
      console.log('WebApp is not ready yet');
    }
  }, [isReady, fetchPortfolios]);

  // Handle create portfolio
  const handleCreatePortfolio = async (defaultName?: string) => {
    const portfolioName = defaultName || newPortfolioName.trim();
    
    if (!portfolioName) {
      WebApp.showAlert('Please enter a portfolio name');
      return;
    }
    
    try {
      setLoading(true);
      const newPortfolio = await apiService.createPortfolio({
        name: portfolioName
      });
      
      setPortfolios(prev => [...prev, newPortfolio]);
      setNewPortfolioName('');
      setIsCreatingPortfolio(false);
      webApp?.HapticFeedback.notificationOccurred('success');
      
      // Navigate to the new portfolio
      navigate(`/portfolio/${newPortfolio.portfolio_id}`);
    } catch (err) {
      console.error('Error creating portfolio:', err);
      WebApp.showAlert('Failed to create portfolio. Please try again.');
      webApp?.HapticFeedback.notificationOccurred('error');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete portfolio
  const handleDeletePortfolio = async (portfolioId: string) => {
    WebApp.showConfirm(
      'Are you sure you want to delete this portfolio? This action cannot be undone.',
      async (confirmed) => {
        if (confirmed) {
          try {
            setLoading(true);
            await apiService.deletePortfolio(portfolioId);
            
            // Update portfolios list
            setPortfolios(prev => prev.filter(p => p.portfolio_id !== portfolioId));
            webApp?.HapticFeedback.notificationOccurred('success');
          } catch (err) {
            console.error('Error deleting portfolio:', err);
            WebApp.showAlert('Failed to delete portfolio. Please try again.');
            webApp?.HapticFeedback.notificationOccurred('error');
          } finally {
            setLoading(false);
          }
        }
      }
    );
  };

  // Handle portfolio selection
  const handleSelectPortfolio = (portfolio: Portfolio) => {
    webApp?.HapticFeedback.impactOccurred('light');
    navigate(`/portfolio/${portfolio.portfolio_id}`);
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading && portfolios.length === 0) {
    return (
      <div className={styles.loaderContainer}>
        <p>Loading portfolios...</p>
        <Loader />
      </div>
    );
  }

  return (
    <div className={styles.portfolioScreen}>
      <div className={styles.portfolioHeader}>
        <h1 className={styles.screenTitle}>Portfolio Tracker</h1>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
          <button 
            className={styles.retryButton}
            onClick={() => {
              webApp?.HapticFeedback.impactOccurred('light');
              fetchPortfolios();
            }}
          >
            Retry
          </button>
        </div>
      )}

      <div className={styles.portfolioContent}>
        <div className={styles.portfolioSelector}>
          <div className={styles.portfolioSelectorHeader}>
            <h2>My Portfolios: {portfolios.length}</h2>
            <button 
              className={styles.createPortfolioBtn}
              onClick={() => {
                webApp?.HapticFeedback.impactOccurred('light');
                setIsCreatingPortfolio(true);
              }}
            >
              New Portfolio
            </button>
          </div>
          
          {isCreatingPortfolio && (
            <div className={styles.createPortfolioForm}>
              <input
                type="text"
                placeholder="Portfolio Name"
                value={newPortfolioName}
                onChange={(e) => setNewPortfolioName(e.target.value)}
                className={styles.portfolioNameInput}
                autoFocus
              />
              <div className={styles.createPortfolioActions}>
                <button 
                  className={styles.cancelBtn}
                  onClick={() => {
                    webApp?.HapticFeedback.impactOccurred('light');
                    setIsCreatingPortfolio(false);
                    setNewPortfolioName('');
                  }}
                >
                  Cancel
                </button>
                <button 
                  className={styles.createBtn}
                  onClick={() => {
                    webApp?.HapticFeedback.impactOccurred('light');
                    handleCreatePortfolio();
                  }}
                  disabled={!newPortfolioName.trim()}
                >
                  Create
                </button>
              </div>
            </div>
          )}
          
          {portfolios.length === 0 ? (
            <div className={styles.noAssets}>
              <p>No portfolios found</p>
              <button 
                className={styles.addFirstAssetBtn}
                onClick={() => {
                  webApp?.HapticFeedback.impactOccurred('light');
                  handleCreatePortfolio('My Portfolio');
                }}
              >
                Create Default Portfolio
              </button>
            </div>
          ) : (
            <div className={styles.portfolioList}>
              {portfolios.map((portfolio) => (
                <div 
                  key={portfolio.portfolio_id}
                  className={styles.portfolioItem}
                  onClick={() => handleSelectPortfolio(portfolio)}
                >
                  <div className={styles.portfolioItemInfo}>
                    <h3>{portfolio.name}</h3>
                    <div className={styles.portfolioItemDetails}>
                      <span className={styles.portfolioItemDate}>
                        Created: {formatDate(portfolio.created_at)}
                      </span>
                    </div>
                    <div className={styles.portfolioStats}>
                      <span className={styles.assetsCount}>
                        Assets: {portfolio.assetsCount || 0}
                      </span>
                      <span className={styles.lastUpdated}>
                        Updated: {formatDate(portfolio.updated_at)}
                      </span>
                    </div>
                  </div>
                  <button 
                    className={styles.deletePortfolioBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      webApp?.HapticFeedback.impactOccurred('light');
                      handleDeletePortfolio(portfolio.portfolio_id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioScreen; 