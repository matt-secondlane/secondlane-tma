import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './WelcomeScreen.module.css';
import logoSecondLane from '../../assets/logoSecondLane.svg';
import welcomeIllustration from '../../assets/SLlogo.jpg';

export const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGetStarted = () => {
    navigate('/attestation');
  };

  return (
    <div className={styles.welcomeContainer}>
      <div className={styles.welcomeHeader}>
        <div className={styles.headerLogoContainer}>
          <img src={logoSecondLane} alt="SecondLane" className={styles.headerLogo} />
        </div>
        <h1 className={styles.screenTitle}>Welcome to SecondLane</h1>
      </div>

      <div className={styles.welcomeContent}>
        <div className={styles.illustrationContainer}>
          <img 
            src={welcomeIllustration} 
            alt="Welcome Illustration" 
            className={styles.illustration} 
          />
        </div>
        
        <div className={styles.welcomeMessage}>
          <p>
            Complete this short questionnaire and explore the latest deals and information on top industry projects.
          </p>
        </div>

        <h2 className={styles.featuresTitle}>What you'll get access to:</h2>
        
        <div className={styles.featuresList}>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>
              <span role="img" aria-label="Search">🔍</span>
            </div>
            <div className={styles.featureContent}>
              <h3 className={styles.featureTitle}>Explore exclusive deals</h3>
              <p className={styles.featureDescription}>
                Find the best investment opportunities
              </p>
            </div>
          </div>
          
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>
              <span role="img" aria-label="Chart">📊</span>
            </div>
            <div className={styles.featureContent}>
              <h3 className={styles.featureTitle}>Get project information</h3>
              <p className={styles.featureDescription}>
                Stay informed with latest industry data
              </p>
            </div>
          </div>
          
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>
              <span role="img" aria-label="Mobile">📱</span>
            </div>
            <div className={styles.featureContent}>
              <h3 className={styles.featureTitle}>Manage your portfolio</h3>
              <p className={styles.featureDescription}>
                Track investments in one place
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.actionButtonContainer}>
        <button 
          onClick={handleGetStarted} 
          className={styles.actionButton}
          style={{ 
            opacity: mounted ? 1 : 0, 
            transform: mounted ? 'translateY(0)' : 'translateY(20px)'
          }}
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen; 