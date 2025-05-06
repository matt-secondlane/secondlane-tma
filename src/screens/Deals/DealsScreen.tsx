import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { useTelegram } from '../../hooks/useTelegram';
import { apiService } from '../../utils/api';
import { OrderbookItem } from '../../types/api';
import styles from './DealsScreen.module.css';
import { Loader } from '../../components/Loader';
import { formatMoney } from '../../utils/money';
import TabsComponent, { TabItem } from '../../components/TabsComponent/TabsComponent';

const ITEMS_PER_PAGE = 10;

export const DealsScreen = () => {
  const navigate = useNavigate();
  const { isReady, webApp } = useTelegram();
  const [activeTab, setActiveTab] = useState<'all' | 'buy' | 'sell'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const pageRef = useRef(1);
  const [deals, setDeals] = useState<OrderbookItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);
  const observer = useRef<IntersectionObserver | null>(null);

  const loadDeals = useCallback(async (pageToLoad: number) => {
    if (loadingRef.current) return;

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      
      console.log(`Loading deals page ${pageToLoad} with search: "${searchQuery}", tab: ${activeTab}`);
      
      const response = await apiService.getOrderbook({
        offset: (pageToLoad - 1) * ITEMS_PER_PAGE,
        limit: ITEMS_PER_PAGE,
        search: searchQuery,
        type: activeTab === 'all' ? undefined : activeTab === 'buy' ? 'Buy' : 'Sell'
      });

      if (pageToLoad === 1) {
        setDeals(response.data);
      } else {
        setDeals(prev => {
          // Remove duplicates by order_id
          const newDeals = response.data.filter(
            newDeal => !prev.some(existingDeal => existingDeal.order_id === newDeal.order_id)
          );
          return [...prev, ...newDeals];
        });
      }
      
      setHasMore(response.data.length === ITEMS_PER_PAGE);
    } catch (err) {
      console.error('Error loading deals:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while loading deals');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    if (isReady) {
      WebApp.ready();
      pageRef.current = 1;
      loadDeals(1);
    }
  }, [isReady, activeTab, searchQuery, loadDeals]);

  // Setup intersection observer for infinite scrolling
  const lastDealRef = useCallback((node: HTMLDivElement) => {
    if (!node || loading || !hasMore || loadingRef.current) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingRef.current && !loading) {
        pageRef.current += 1;
        loadDeals(pageRef.current);
      }
    }, {
      rootMargin: '100px' // Preload before reaching end of list
    }); 
    
    observer.current.observe(node);
  }, [hasMore, loading, loadDeals]);

  const handleTabChange = (tabId: string) => {
    webApp?.HapticFeedback.impactOccurred('light');
    setActiveTab(tabId as 'all' | 'buy' | 'sell');
    pageRef.current = 1;
    setDeals([]);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    pageRef.current = 1;
  };

  const tabs: TabItem[] = [
    { id: 'all', label: 'All' },
    { id: 'buy', label: 'Buy' },
    { id: 'sell', label: 'Sell' }
  ];

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
            onClick={(e) => e.currentTarget.focus()}
            onTouchStart={(e) => e.currentTarget.focus()}
          />
        </div>

        <TabsComponent 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
          containerClassname={styles.tabsContainer} 
          tabClassname={styles.tab} 
          activeTabClassname={styles.active}
        />

      </div>

      <div className={styles.content}>
        {error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <>
            <div className={styles.dealsList}>
              {deals.map((deal, index) => (
                <div 
                  key={deal.order_id}
                  className={styles.dealCard}
                  ref={deals.length === index + 1 ? lastDealRef : undefined}
                  onClick={() => {
                    webApp?.HapticFeedback.impactOccurred('light');
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
            </div>
            {loading && (
              <div className={styles.loaderContainer}>
                <Loader />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}; 