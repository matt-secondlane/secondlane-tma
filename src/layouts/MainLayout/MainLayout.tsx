import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTelegram } from '../../hooks/useTelegram';
import { BottomNav } from '../../components/BottomNav';
import { Header } from '../../components/Header';
import styles from './MainLayout.module.css';

interface MainLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

// Utility for combining classes
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

export const MainLayout: React.FC<MainLayoutProps> = ({ 
  className,
  ...props 
}) => {
  const { isReady } = useTelegram();

  return (
    <div 
      className={cn(
        styles.root,
        isReady && styles.ready,
        className
      )}
      {...props}
    >
      <Header />
      <main className={styles.main}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}; 