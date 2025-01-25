import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { useTelegram } from '../../hooks/useTelegram';
import { apiService } from '../../utils/api';
import { OrderbookItem } from '../../types/api';
import styles from './DealsScreen.module.css';
import { Loader } from '../../components/Loader';
import { parseNumberWithSuffix, formatMoney } from '../../utils/money';

const ITEMS_PER_PAGE = 10;

export const DealsScreen = () => {
  const navigate = useNavigate();
  const { isReady, webApp } = useTelegram();
  const [activeTab, setActiveTab] = useState<'all' | 'buy' | 'sell'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [deals, setDeals] = useState<OrderbookItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadDeals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getOrderbook({
        offset: (page - 1) * ITEMS_PER_PAGE,
        limit: ITEMS_PER_PAGE,
        search: searchQuery,
        type: activeTab === 'all' ? undefined : activeTab === 'buy' ? 'Buy' : 'Sell'
      });

      if (page === 1) {
        setDeals(response.data);
      } else {
        setDeals(prev => [...prev, ...response.data]);
      }
      
      setHasMore(response.data.length === ITEMS_PER_PAGE);
    } catch (err) {
      console.error('Error loading deals:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while loading deals');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, page]);

  useEffect(() => {
    if (isReady) {
      WebApp.ready();
      setPage(1);
      loadDeals();
    }
  }, [isReady, activeTab, searchQuery, loadDeals]);

  useEffect(() => {
    if (page > 1 && isReady) {
      loadDeals();
    }
  }, [page, isReady, loadDeals]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && !loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const handleTabChange = (tab: 'all' | 'buy' | 'sell') => {
    webApp?.HapticFeedback.impactOccurred('light');
    setActiveTab(tab);
    setPage(1);
    setDeals([]);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  return (
    <div className={styles.dealsScreen}>
      <div className={styles.header}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search deals"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
            onClick={() => handleTabChange('all')}
          >
            All
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'buy' ? styles.active : ''}`}
            onClick={() => handleTabChange('buy')}
          >
            Buy
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'sell' ? styles.active : ''}`}
            onClick={() => handleTabChange('sell')}
          >
            Sell
          </button>
        </div>
      </div>

      <div className={styles.content} onScroll={handleScroll}>
        {error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <div className={styles.dealsList}>
            {deals.map((deal) => (
              <div 
                key={deal.order_id}
                className={styles.dealCard}
                onClick={() => {
                  webApp?.HapticFeedback.impactOccurred('light');
                  console.log('Deal type before navigation:', deal.deal_type);
                  navigate(`/place-inquiry/${deal.order_id}`, {
                    state: { 
                      logo: deal.logo,
                      deal_type: deal.deal_type
                    }
                  });
                }}
              >
                <div className={styles.cardContent}>
                  <div className={styles.leftSection}>
                    <img 
                      src={deal.logo || '/default-project-logo.svg'} 
                      alt={deal.project_name}
                      className={styles.projectLogo}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/default-project-logo.svg';
                      }}
                    />
                    <div className={styles.projectInfo}>
                      <div className={styles.projectMain}>
                        <span className={styles.projectName}>{deal.project_name}</span>
                        <span className={styles.assetType}>{deal.deal_type === 'LIQUID_TOKEN' ? 'Token' : 'Equity'}</span>
                      </div>
                      <div className={styles.dealValues}>
                        <div className={styles.valueGroup}>
                          <span className={styles.valueLabel}>Amount</span>
                          <span className={styles.valueAmount}>
                            {formatMoney(deal.offered_amount)}
                          </span>
                        </div>
                        <div className={styles.separator}>•</div>
                        <div className={styles.valueGroup}>
                          <span className={styles.valueLabel}>FDV</span>
                          <span className={styles.valueAmount}>
                            {formatMoney(deal.offered_fully_diluted_value)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={styles.rightSection}>
                    <span className={`${styles.type} ${styles[deal.type.toLowerCase()]}`}>
                      {deal.type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className={styles.loading}>
                <Loader />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 