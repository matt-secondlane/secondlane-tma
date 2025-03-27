import React, { useState } from 'react';
import { useTelegram } from '../../../hooks/useTelegram';
import styles from './PortfolioOnboarding.module.css';

interface OnboardingSlide {
  title: string;
  content: string;
  image?: string;
  highlight?: string; // CSS class for highlighted area
}

interface PortfolioOnboardingProps {
  onComplete: () => void;
}

export const PortfolioOnboarding: React.FC<PortfolioOnboardingProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { webApp } = useTelegram();

  // Onboarding slides data
  const onboardingSlides: OnboardingSlide[] = [
    {
      title: 'Import Portfolio Data',
      content: 'Click the "New Portfolio" button to get started, then use "Get CSV Template" to download a sample.',
      highlight: styles.highlightNewPortfolioBtn
    },
    {
      title: 'Upload Your CSV File',
      content: 'Create a portfolio name first, then click "Import from CSV" to select and upload your prepared file.',
      highlight: styles.highlightImportCSV
    },
    {
      title: 'Add Assets Manually',
      content: 'After creating a portfolio, click on it to open, then use "Add Asset" button to enter data manually.',
      highlight: styles.highlightPortfolioItem
    },
    {
      title: 'View Your Portfolio',
      content: 'Click on any portfolio card to see all your assets, total value, and performance in one screen.',
      highlight: styles.highlightPortfolioCard
    },
    {
      title: 'Manage Your Assets',
      content: 'Use "Edit" and "Delete" buttons next to each asset to update your portfolio as investments change.',
      highlight: styles.highlightAssetControls
    }
  ];

  // Handle next slide
  const handleNextSlide = () => {
    if (currentSlide < onboardingSlides.length - 1) {
      setCurrentSlide(prev => prev + 1);
      webApp?.HapticFeedback.impactOccurred('light');
    } else {
      onComplete();
    }
  };

  // Handle previous slide
  const handlePrevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
      webApp?.HapticFeedback.impactOccurred('light');
    }
  };

  // Handle skip onboarding
  const handleSkipOnboarding = () => {
    onComplete();
  };

  const slide = onboardingSlides[currentSlide];

  return (
    <div className={styles.portfolioScreen}>
      <div className={styles.portfolioHeader}>
        <h1 className={styles.screenTitle}>{slide.title}</h1>
      </div>

      <div className={styles.portfolioContent}>
        <div className={styles.onboardingBody}>
          <p className={styles.onboardingText}>{slide.content}</p>
          
          <div className={styles.visualGuide}>
            <div className={`${styles.interfacePreview} ${slide.highlight}`}>
              {currentSlide === 0 && (
                <div className={styles.mockInterface}>
                  <div className={styles.mockHeader}>
                    <div className={styles.mockTitle}>Portfolio Tracker</div>
                  </div>
                  <div className={styles.mockContent}>
                    <div className={styles.mockSectionHeader}>
                      <div>My Portfolios: 0</div>
                      <div className={styles.mockNewPortfolioBtn}>New Portfolio</div>
                    </div>
                    <div className={styles.pointerHand}></div>
                  </div>
                </div>
              )}
              
              {currentSlide === 1 && (
                <div className={styles.mockInterface}>
                  <div className={styles.mockFormContainer}>
                    <div className={styles.mockInput}>Portfolio Name</div>
                    <div className={styles.mockButtons}>
                      <div className={styles.mockTemplateBtn}>Get CSV Template</div>
                      <div className={styles.mockImportBtn}>Import from CSV</div>
                      <div className={styles.pointerHand}></div>
                    </div>
                  </div>
                </div>
              )}
              
              {currentSlide === 2 && (
                <div className={styles.mockInterface}>
                  <div className={styles.mockPortfolioDetail}>
                    <div className={styles.mockDetailHeader}>My Portfolio</div>
                    <div className={styles.mockAssetsList}>
                      <div className={styles.mockAddAssetBtn}>
                        Add Asset
                        <div className={styles.pointerHand}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {currentSlide === 3 && (
                <div className={styles.mockInterface}>
                  <div className={styles.mockPortfolioList}>
                    <div className={styles.mockPortfolioCard}>
                      <div className={styles.mockCardHeader}>Crypto Portfolio</div>
                      <div className={styles.mockCardDetails}>
                        <div>Assets: 5</div>
                        <div>Updated: Jan 15, 2023</div>
                      </div>
                      <div className={styles.pointerHand}></div>
                    </div>
                  </div>
                </div>
              )}
              
              {currentSlide === 4 && (
                <div className={styles.mockInterface}>
                  <div className={styles.mockAssetsList}>
                    <div className={styles.mockAssetItem}>
                      <div className={styles.mockAssetInfo}>
                        <div>Bitcoin (BTC)</div>
                        <div>0.25 BTC · $12,500</div>
                      </div>
                      <div className={styles.mockAssetControls}>
                        <div className={styles.mockEditBtn}>Edit</div>
                        <div className={styles.mockDeleteBtn}>Delete</div>
                        <div className={styles.pointerHand}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className={styles.onboardingProgress}>
            {onboardingSlides.map((_, index) => (
              <div 
                key={index} 
                className={`${styles.onboardingProgressDot} ${index === currentSlide ? styles.onboardingProgressDotActive : ''}`}
              />
            ))}
          </div>
          
          <div className={styles.onboardingActions}>
            {currentSlide < onboardingSlides.length - 1 ? (
              <>
                <button className={styles.onboardingSkipBtn} onClick={handleSkipOnboarding}>
                  Skip
                </button>
                <div className={styles.navigationButtons}>
                  {currentSlide > 0 && (
                    <button className={styles.onboardingBackBtn} onClick={handlePrevSlide}>
                      Back
                    </button>
                  )}
                  <button className={styles.onboardingNextBtn} onClick={handleNextSlide}>
                    Next
                  </button>
                </div>
              </>
            ) : (
              <button className={styles.onboardingStartBtn} onClick={onComplete}>
                Get Started
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioOnboarding; 