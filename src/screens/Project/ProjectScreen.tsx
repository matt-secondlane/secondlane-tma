import React, { useEffect, useState } from 'react';
import styles from './ProjectScreen.module.css';
import WebApp from '@twa-dev/sdk';
import { PlaceBidForm } from '../../components/PlaceBidForm/PlaceBidForm';

interface ProjectScreenProps {
  id: string;
}

interface ProjectData {
  logo: string;
  name: string;
  description: string;
  offeredAmount: {
    percentage: string;
    amount: string;
  };
  fdv: string;
  round: string;
  type: {
    action: string;
    amount: number;
  };
  dealType: string;
}

export const ProjectScreen: React.FC<ProjectScreenProps> = ({ id }) => {
  const [project] = useState<ProjectData>({
    logo: "/assets/stTON.svg",
    name: "WTS",
    description: "I don't have a meme token, my wolf who heard the words love you udness to reach the top",
    offeredAmount: {
      percentage: "0.01%",
      amount: "$1M"
    },
    fdv: "$350M",
    round: "Series A",
    type: {
      action: "Buy",
      amount: 0
    },
    dealType: "NFT"
  });

  const [showBidForm, setShowBidForm] = useState(false);

  useEffect(() => {
    WebApp.ready();
    WebApp.expand();
  }, [id]);

  const handleBidSuccess = () => {
    setShowBidForm(false);
    WebApp.showPopup({
      title: 'Success',
      message: 'Your bid has been successfully placed',
      buttons: [{ type: 'ok' }]
    });
  };

  if (showBidForm) {
    return (
      <div className={styles.projectScreen}>
        <div className="screen-content">
          <PlaceBidForm 
            orderId={id}
            onSuccess={handleBidSuccess}
            onCancel={() => setShowBidForm(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.projectScreen}>
      <div className="screen-content">
        <div className={styles.content}>
          <div className={styles.projectHeader}>
            <div className={styles.projectInfo}>
              <img src={project.logo} alt={project.name} className={styles.projectLogo} />
              <h1 className={styles.projectName}>{project.name}</h1>
            </div>
            <p className={styles.projectDescription}>{project.description}</p>
          </div>

          <div className={styles.projectDetails}>
            <div className={styles.detailRow}>
              <div className={styles.detailHeader}>
                <span className={styles.detailLabel}>Offered Amount</span>
                <div className={styles.detailValue}>
                  <span className={styles.percentage}>{project.offeredAmount.percentage}</span>
                  <span>{project.offeredAmount.amount}</span>
                </div>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} />
              </div>
            </div>

            <div className={styles.detailRow}>
              <div className={styles.detailHeader}>
                <span className={styles.detailLabel}>Fully Diluted Value</span>
                <span className={styles.detailValue}>{project.fdv}</span>
              </div>
            </div>

            <div className={styles.detailRow}>
              <div className={styles.detailHeader}>
                <span className={styles.detailLabel}>Round</span>
                <span className={styles.detailValue}>{project.round}</span>
              </div>
            </div>

            <div className={styles.detailRow}>
              <div className={styles.detailHeader}>
                <span className={styles.detailLabel}>Type</span>
                <span className={styles.detailValue}>
                  <span className={styles.buyType}>({project.type.action})</span>
                  <span>{project.type.amount}</span>
                </span>
              </div>
            </div>

            <div className={styles.detailRow}>
              <div className={styles.detailHeader}>
                <span className={styles.detailLabel}>Deal Type</span>
                <span className={styles.detailValue}>{project.dealType}</span>
              </div>
            </div>
          </div>

          <button 
            className={styles.placeBidButton} 
            onClick={() => {
              WebApp.HapticFeedback.impactOccurred('medium');
              setShowBidForm(true);
            }}
          >
            Place Bid
          </button>
        </div>
      </div>
    </div>
  );
}; 