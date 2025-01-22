import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTelegram } from './hooks/useTelegram';
import { MainLayout } from './layouts/MainLayout';
import { DealsScreen } from './screens/Deals';
import { DatabaseScreen } from './screens/Database';
import { ProjectDetailsScreen } from './screens/Database/ProjectDetailsScreen';
import PortfolioScreen from './screens/Portfolio';
import { PlaceInquiryScreen } from './screens/PlaceInquiry/PlaceInquiryScreen';
import { PlaceRFQScreen } from './screens/PlaceRFQ/PlaceRFQScreen';
import { Loader } from './components/Loader';

// Global flag for App.tsx
let isAppInitialized = false;

function App() {
  const { webApp, isReady } = useTelegram();

  useEffect(() => {
    // Wait until root element is available and WebApp is ready
    const rootElement = document.getElementById('root');
    if (webApp && !isAppInitialized && rootElement && isReady) {
      try {
        webApp.ready();
        webApp.expand();
        webApp.enableClosingConfirmation();
        webApp.disableVerticalSwipes();
        webApp.requestFullscreen();
        isAppInitialized = true;
      } catch (error) {
        console.error('Error initializing WebApp:', error);
      }
    }
  }, [webApp, isReady]);

  if (!isReady) {
    return <Loader />;
  }

  return (
    <HashRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/deals" replace />} />
          <Route path="/deals" element={<DealsScreen />} />
          <Route path="/database" element={<DatabaseScreen />} />
          <Route path="/database/project/:projectId" element={<ProjectDetailsScreen />} />
          <Route path="/portfolio" element={<PortfolioScreen />} />
          <Route path="/place-inquiry/:orderId" element={<PlaceInquiryScreen />} />
          <Route path="/place-rfq/:projectId" element={<PlaceRFQScreen />} />
          <Route path="*" element={<Navigate to="/deals" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
