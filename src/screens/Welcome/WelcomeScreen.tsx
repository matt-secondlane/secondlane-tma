import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './WelcomeScreen.module.css';
import logoImage from '../../assets/logoSecondLane.svg';
import welcomeIllustration from '../../assets/welcome-illustration.svg';

export const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/attestation');
  };

  return (
    <div className={styles.welcomeContainer}>
      <div className={styles.welcomeContent}>
        <img src={logoImage} alt="Second Lane Logo" className={styles.logo} />
        
        <img 
          src={welcomeIllustration} 
          alt="Welcome Illustration" 
          className={styles.illustration} 
        />
        
        <h1 className={styles.welcomeTitle}>Welcome to SecondLane</h1>
        
        <div className={styles.welcomeMessage}>
          <p>
            Please complete this short self-attestation questionnaire on the following 
            two screens and enjoy searching the latest deals and information 
            on top industry projects.
          </p>
        </div>

        <div className={styles.features}>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>🔍</div>
            <div className={styles.featureText}>Explore exclusive deals</div>
          </div>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>📊</div>
            <div className={styles.featureText}>Get up-to-date project information</div>
          </div>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>📱</div>
            <div className={styles.featureText}>Manage your portfolio</div>
          </div>
        </div>

        <button 
          onClick={handleGetStarted} 
          className={styles.getStartedButton}
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen; 