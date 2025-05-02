import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { PortfolioUnlocks } from '../../components/PortfolioUnlocks';
import styles from './PortfolioUnlocksScreen.module.css';

export const PortfolioUnlocksScreen: React.FC = () => {
  const navigate = useNavigate();
  const { portfolioId } = useParams<{ portfolioId: string }>();
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={() => {
            WebApp.HapticFeedback.impactOccurred('light');
            navigate(`/portfolio/${portfolioId}`);
          }}
        >
          ←
        </button>
        <h1 className={styles.title}>Token Unlocks</h1>
      </div>
      
      <div className={styles.content}>
        <PortfolioUnlocks portfolioId={portfolioId} />
      </div>
    </div>
  );
};

export default PortfolioUnlocksScreen; 