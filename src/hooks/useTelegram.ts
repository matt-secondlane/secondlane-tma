import { useState, useEffect } from 'react';
import type { TelegramWebApp } from '../utils/telegram';
import WebApp from '@twa-dev/sdk';

export const useTelegram = () => {
  const [isReady, setIsReady] = useState(false);
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);

  useEffect(() => {
    const initializeWebApp = () => {
      console.log('Initializing WebApp...', {
        window: {
          Telegram: !!window.Telegram,
          WebApp: !!window.Telegram?.WebApp,
        },
        sdk: {
          WebApp: !!WebApp,
          initData: WebApp.initData,
          initDataUnsafe: WebApp.initDataUnsafe,
        }
      });

      if (!window.Telegram?.WebApp) {
        console.error('WebApp is not available in window.Telegram');
        return false;
      }

      try {
        // Initialize WebApp
        WebApp.ready();
        WebApp.expand();
        
        // Check required data
        const initData = WebApp.initData;
        const initDataUnsafe = WebApp.initDataUnsafe;

        console.log('WebApp initialized:', {
          initData: initData?.substring(0, 50) + '...',
          initDataUnsafe: {
            ...initDataUnsafe,
            user: initDataUnsafe?.user ? {
              id: initDataUnsafe.user.id,
              username: initDataUnsafe.user.username,
              language_code: initDataUnsafe.user.language_code
            } : null
          }
        });

        if (!initData || !initDataUnsafe?.user) {
          console.error('Missing required WebApp data:', {
            hasInitData: !!initData,
            hasUser: !!initDataUnsafe?.user
          });
          return false;
        }

        setWebApp(window.Telegram.WebApp as TelegramWebApp);
        setIsReady(true);
        return true;
      } catch (error) {
        console.error('Error initializing WebApp:', error);
        return false;
      }
    };

    // Try to initialize WebApp
    const initialized = initializeWebApp();
    if (!initialized) {
      // If initialization failed, try again in 1 second
      const timer = setTimeout(() => {
        console.log('Retrying WebApp initialization...');
        initializeWebApp();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  return {
    webApp,
    isReady,
  };
}; 