import type { TelegramWebApp } from '../utils/telegram';

declare global {
  interface Window {
    Telegram: {
      WebApp: TelegramWebApp;
    };
  }
} 