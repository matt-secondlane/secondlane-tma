import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTelegram } from './hooks/useTelegram';
import { MainLayout } from './layouts/MainLayout';
import { DealsScreen } from './screens/Deals';
import { DatabaseScreen } from './screens/Database';
import { ProjectDetailsScreen } from './screens/Database/ProjectDetailsScreen';
import PortfolioScreen, { CreatePortfolioAssetScreen, EditPortfolioAssetScreen } from './screens/Portfolio';
import PortfolioDetailScreen from './screens/Portfolio/PortfolioDetailScreen';
import { PlaceInquiryScreen } from './screens/PlaceInquiry/PlaceInquiryScreen';
import { PlaceRFQScreen } from './screens/PlaceRFQ/PlaceRFQScreen';
import { AttestationScreen } from './screens/Attestation/AttestationScreen';
import { NotificationsScreen, NotificationSettingsScreen } from './screens/Notifications';
import { Loader } from './components/Loader';
import { apiService } from './utils/api';

// Global flag for App.tsx
let isAppInitialized = false;

function App() {
  const { webApp, isReady } = useTelegram();
  const [isAttested, setIsAttested] = useState<boolean | null>(null);
  const [isCheckingAttestation, setIsCheckingAttestation] = useState(true);

  // Check attestation status
  useEffect(() => {
    if (isReady) {
      const checkAttestationStatus = async () => {
        try {
          setIsCheckingAttestation(true);
          const response = await apiService.getAttestationStatus();
          setIsAttested(response.is_attested);
        } catch (error) {
          console.error('Error checking attestation status:', error);
          // If there's an error, we'll assume the user is not attested
          setIsAttested(false);
        } finally {
          setIsCheckingAttestation(false);
        }
      };

      checkAttestationStatus();
    }
  }, [isReady]);

  // Add a function to refresh attestation status
  const refreshAttestationStatus = async () => {
    try {
      setIsCheckingAttestation(true);
      const response = await apiService.getAttestationStatus();
      setIsAttested(response.is_attested);

      // If the user is now attested, navigate them away from the attestation screen
      if (response.is_attested) {
        // We'll let the route handling in the return statement handle the navigation
        console.log('User is now attested, will redirect to main app');
      }
    } catch (error) {
      console.error('Error refreshing attestation status:', error);
    } finally {
      setIsCheckingAttestation(false);
    }
  };

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

  if (!isReady || isCheckingAttestation) {
    return <Loader />;
  }

  return (
    <HashRouter>
      <Routes>
        {/* Attestation screen (outside of MainLayout) */}
        <Route path="/attestation" element={
          isAttested 
            ? <Navigate to="/" replace /> 
            : <AttestationScreen onAttestationComplete={refreshAttestationStatus} />
        } />
        {/* <Route path="/attestation" element={<AttestationScreen />} /> */}
        
        <Route element={<MainLayout />}>
          {/* Redirect to attestation if not attested */}
          <Route 
            path="/" 
            element={
              isAttested === false 
                ? <Navigate to="/attestation" replace /> 
                : <Navigate to="/deals" replace />
            } 
          />
          <Route 
            path="/deals" 
            element={
              isAttested === false 
                ? <Navigate to="/attestation" replace /> 
                : <DealsScreen />
            } 
          />
          <Route 
            path="/notifications" 
            element={
              isAttested === false 
                ? <Navigate to="/attestation" replace /> 
                : <NotificationsScreen />
            } 
          />
          <Route 
            path="/notification-settings" 
            element={
              isAttested === false 
                ? <Navigate to="/attestation" replace /> 
                : <NotificationSettingsScreen />
            } 
          />
          <Route 
            path="/database" 
            element={
              isAttested === false 
                ? <Navigate to="/attestation" replace /> 
                : <DatabaseScreen />
            } 
          />
          <Route 
            path="/database/project/:projectId" 
            element={
              isAttested === false 
                ? <Navigate to="/attestation" replace /> 
                : <ProjectDetailsScreen />
            } 
          />
          <Route 
            path="/portfolio" 
            element={
              isAttested === false 
                ? <Navigate to="/attestation" replace /> 
                : <PortfolioScreen />
            } 
          />
          <Route 
            path="/portfolio/:portfolioId" 
            element={
              isAttested === false 
                ? <Navigate to="/attestation" replace /> 
                : <PortfolioDetailScreen />
            } 
          />
          <Route 
            path="/portfolio/:portfolioId/create-asset" 
            element={
              isAttested === false 
                ? <Navigate to="/attestation" replace /> 
                : <CreatePortfolioAssetScreen />
            } 
          />
          <Route 
            path="/portfolio/:portfolioId/edit-asset/:assetId" 
            element={
              isAttested === false 
                ? <Navigate to="/attestation" replace /> 
                : <EditPortfolioAssetScreen />
            } 
          />
          <Route 
            path="/place-inquiry" 
            element={
              isAttested === false 
                ? <Navigate to="/attestation" replace /> 
                : <PlaceInquiryScreen />
            } 
          />
          <Route 
            path="/place-inquiry/:orderId" 
            element={
              isAttested === false 
                ? <Navigate to="/attestation" replace /> 
                : <PlaceInquiryScreen />
            } 
          />
          <Route 
            path="/place-rfq" 
            element={
              isAttested === false 
                ? <Navigate to="/attestation" replace /> 
                : <PlaceRFQScreen />
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
