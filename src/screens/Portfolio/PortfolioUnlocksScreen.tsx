import React from 'react';
import { useParams } from 'react-router-dom';
import { PortfolioUnlocks } from '../../components/PortfolioUnlocks';
import styles from './PortfolioUnlocksScreen.module.css';

export const PortfolioUnlocksScreen: React.FC = () => {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Token Unlocks</h1>
      </div>
      
      <div className={styles.content}>
        <PortfolioUnlocks portfolioId={portfolioId} />
      </div>
    </div>
  );
};

export default PortfolioUnlocksScreen; 