import WebApp from '@twa-dev/sdk';

// Define WebApp type
export type TelegramWebApp = typeof WebApp & {
  // New fields from Bot API 8.0
  isActive: boolean;
  isFullscreen: boolean;
  safeAreaInset: SafeAreaInset;
  contentSafeAreaInset: SafeAreaInset;
  isExpanded: boolean;
  viewportStableHeight: number;
  version: string;
  platform: string;
  headerColor: string;
  backgroundColor: string;
};

export interface ViewportSettings {
  animation_duration?: number;
}

export interface SafeAreaInset {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface TelegramWebAppInitData {
  query_id?: string;
  user?: TelegramWebAppUser;
  auth_date: number;
  hash: string;
}

// Events
export interface ViewportChangedEvent {
  isStateStable: boolean;
  height: number;
}

export interface SafeAreaChangedEvent {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface EventParams {
  viewportChanged: ViewportChangedEvent;
  themeChanged: void;
  safeAreaChanged: SafeAreaChangedEvent;
  popupClosed: { button_id: string };
}

// Functions for working with Telegram WebApp
export const initTelegramApp = () => {
  try {
    WebApp.ready();
    console.log('Telegram WebApp initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize Telegram WebApp:', error);
    return false;
  }
};

export const isTestEnvironment = () => {
  return import.meta.env.DEV || import.meta.env.VITE_IS_TEST_ENV === 'true';
};

export const getDeviceInfo = () => {
  if (!WebApp) return null;
  
  return {
    version: WebApp.version,
    platform: WebApp.platform,
    viewportHeight: WebApp.viewportHeight,
    viewportStableHeight: WebApp.viewportStableHeight,
    isExpanded: WebApp.isExpanded,
    headerColor: WebApp.headerColor,
    backgroundColor: WebApp.backgroundColor
  };
};

export const showAlert = (message: string) => {
  WebApp.showAlert(message);
}; 