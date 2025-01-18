import React from 'react';
import styles from './Header.module.css';
import logoSecondLane from '../../assets/logoSecondLane.svg';

export const Header: React.FC = () => {
  return (
    <header className={styles.header}>
      <div className={styles.userInfo}>
        <img 
          src={logoSecondLane} 
          alt="SecondLane" 
          className={styles.logo}
        />
      </div>
    </header>
  );
};
