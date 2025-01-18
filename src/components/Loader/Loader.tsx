import React from 'react';
import styles from './Loader.module.css';

export const Loader: React.FC = () => {
  return (
    <div className={styles.loadingContainer}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4A4A4A]"></div>
    </div>
  );
}; 