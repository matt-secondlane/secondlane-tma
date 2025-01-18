import React, { useState } from 'react';
import WebApp from '@twa-dev/sdk';
import styles from './PortfolioScreen.module.css';

interface PortfolioItem {
  id: string;
  name: string;
  type: 'token' | 'equity';
  amount: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: string;
}

const mockPortfolio: PortfolioItem[] = [
  {
    id: '1',
    name: 'Project Alpha',
    type: 'token',
    amount: 1000,
    purchasePrice: 1.5,
    currentPrice: 2.3,
    purchaseDate: '2024-01-01'
  },
  {
    id: '2',
    name: 'Project Beta',
    type: 'equity',
    amount: 500,
    purchasePrice: 10,
    currentPrice: 15,
    purchaseDate: '2024-01-15'
  }
];

const PortfolioScreen: React.FC = () => {
  const [portfolio] = useState<PortfolioItem[]>(mockPortfolio);
  const [isUploading, setIsUploading] = useState(false);

  React.useEffect(() => {
    WebApp.ready();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const text = e.target?.result as string;
        try {
          // CSV parsing will be implemented here in the future
          console.log('CSV content:', text);
          WebApp.showAlert('CSV upload will be implemented soon!');
        } catch {
          WebApp.showAlert('Error processing CSV file');
        } finally {
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        WebApp.showAlert('Error reading file');
        setIsUploading(false);
      };

      reader.readAsText(file);
    }
  };

  const handleManualEntry = () => {
    WebApp.showAlert('Manual entry will be implemented soon!');
  };

  const calculateProfitLoss = (item: PortfolioItem) => {
    const profitLoss = (item.currentPrice - item.purchasePrice) * item.amount;
    const percentage = ((item.currentPrice - item.purchasePrice) / item.purchasePrice) * 100;
    return {
      value: profitLoss,
      percentage: percentage
    };
  };

  return (
    <div className={styles.portfolioScreen}>
      <div className={styles.portfolioHeader}>
        <h1 className={styles.screenTitle}>Portfolio Tracker</h1>
        <div className={styles.uploadSection}>
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
              'Upload CSV'
            )}
          </label>
          <button 
            className={styles.manualEntryBtn}
            onClick={handleManualEntry}
            disabled={isUploading}
          >
            Manual Entry
          </button>
        </div>
      </div>

      <div className={styles.portfolioContent}>
        <div className={styles.blurOverlay}>
          <div className={styles.blurMessage}>
            Coming Soon
          </div>
        </div>

        <div className={styles.portfolioList}>
          {portfolio.map((item) => {
            const pl = calculateProfitLoss(item);
            return (
              <div key={item.id} className={styles.portfolioItem}>
                <h3 className={styles.itemName}>{item.name}</h3>
                <div className={styles.itemDetails}>
                  <p>Type: <span>{item.type}</span></p>
                  <p>Amount: <span>{item.amount}</span></p>
                  <p>Purchase Price: <span>${item.purchasePrice}</span></p>
                  <p>Current Price: <span>${item.currentPrice}</span></p>
                  <p>Purchase Date: <span>{new Date(item.purchaseDate).toLocaleDateString()}</span></p>
                  <p>P/L: <span style={{ color: pl.value >= 0 ? '#4CAF50' : '#F44336' }}>
                    ${pl.value.toFixed(2)} ({pl.percentage.toFixed(2)}%)
                  </span></p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PortfolioScreen; 