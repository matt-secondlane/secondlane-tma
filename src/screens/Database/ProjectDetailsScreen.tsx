import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import styles from './ProjectDetailsScreen.module.css';
import { Project, FundingRound } from '../../types/api';
import api from '../../services/api';
import { Loader } from '../../components/Loader';
import ProjectChart from '../../components/ProjectChart/ProjectChart';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  });
};

const getRoundIcon = (roundName: string) => {
  const name = roundName.toLowerCase();
  if (name.includes('seed')) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 2L9.5 6.5H14L10.5 9L12 13.5L8 11L4 13.5L5.5 9L2 6.5H6.5L8 2Z" fill="var(--tg-theme-text-color)"/>
      </svg>
    );
  }
  if (name.includes('private')) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 7H11V5C11 3.34 9.66 2 8 2C6.34 2 5 3.34 5 5V7H4C3.45 7 3 7.45 3 8V13C3 13.55 3.45 14 4 14H12C12.55 14 13 13.55 13 13V8C13 7.45 12.55 7 12 7ZM8 11C7.45 11 7 10.55 7 10C7 9.45 7.45 9 8 9C8.55 9 9 9.45 9 10C9 10.55 8.55 11 8 11ZM9.5 7H6.5V5C6.5 4.17 7.17 3.5 8 3.5C8.83 3.5 9.5 4.17 9.5 5V7Z" fill="var(--tg-theme-text-color)"/>
      </svg>
    );
  }
  if (name.includes('node') || name.includes('sale')) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 2H3C2.45 2 2 2.45 2 3V13C2 13.55 2.45 14 3 14H13C13.55 14 14 13.55 14 13V3C14 2.45 13.55 2 13 2ZM6.5 11.5L3 8L4.41 6.59L6.5 8.67L11.09 4.09L12.5 5.5L6.5 11.5Z" fill="var(--tg-theme-text-color)"/>
      </svg>
    );
  }
  if (name.includes('ido')) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 2C4.69 2 2 4.69 2 8C2 11.31 4.69 14 8 14C11.31 14 14 11.31 14 8C14 4.69 11.31 2 8 2ZM8 12.5C5.51 12.5 3.5 10.49 3.5 8C3.5 5.51 5.51 3.5 8 3.5C10.49 3.5 12.5 5.51 12.5 8C12.5 10.49 10.49 12.5 8 12.5ZM9.75 8C9.75 8.97 8.97 9.75 8 9.75C7.03 9.75 6.25 8.97 6.25 8C6.25 7.03 7.03 6.25 8 6.25C8.97 6.25 9.75 7.03 9.75 8Z" fill="var(--tg-theme-text-color)"/>
      </svg>
    );
  }
  if (name.includes('series') || name.includes('pre-series')) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 8.5H12.5V4C12.5 3.45 12.05 3 11.5 3H8V1.5C8 0.95 7.55 0.5 7 0.5H2C1.45 0.5 1 0.95 1 1.5V7.5C1 8.05 1.45 8.5 2 8.5H3.5V13C3.5 13.55 3.95 14 4.5 14H8V12.5H5V8.5H7C7.55 8.5 8 8.05 8 7.5V4.5H11V8.5H9C8.45 8.5 8 8.95 8 9.5V14.5C8 15.05 8.45 15.5 9 15.5H14C14.55 15.5 15 15.05 15 14.5V9.5C15 8.95 14.55 8.5 14 8.5ZM3.5 7H2.5V2H6.5V7H5V4.5C5 3.95 4.55 3.5 4 3.5H3.5V7Z" fill="var(--tg-theme-text-color)"/>
      </svg>
    );
  }
  return null;
};

export const ProjectDetailsScreen: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRoundIndex, setExpandedRoundIndex] = useState<number | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!projectId) {
          throw new Error('Project ID is required');
        }
        
        const response = await api.get(`/projects/${projectId}`, {
          params: {
            with_rounds: true,
            include: 'rounds'
          }
        });

        setProject(response.data.data);
      } catch (err) {
        console.error('Error loading project:', err);
        setError(err instanceof Error ? err.message : 'Failed to load project details');
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const handleBack = () => {
    WebApp.HapticFeedback.impactOccurred('light');
    navigate('/database');
  };

  const handleRoundClick = (index: number) => {
    // First trigger haptic feedback immediately to ensure it works
    WebApp.HapticFeedback.notificationOccurred('success');
    
    // Then update the state
    setExpandedRoundIndex((prevIndex) => {
      if (prevIndex === index) {
        return null; // Close the round
      } else {
        return index; // Open the round
      }
    });
  };

  const handlePlaceBid = () => {
    if (!project) return;
    
    WebApp.HapticFeedback.impactOccurred('medium');
    navigate(`/place-bid/${project.project_id}`);
  };

  if (isLoading) {
    return <Loader />;
  }

  if (error || !project) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.error}>{error || 'Project not found'}</div>
        <button className={styles.backButton} onClick={handleBack}>
          Back to Database
        </button>
      </div>
    );
  }

  const logoUrl = project.logo || '/assets/default-project-logo.svg';

  return (
    <div className={styles.projectDetails}>
      <button className={styles.backButton} onClick={handleBack}>
        <svg className={styles.backIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div className={styles.projectHeader}>
        <div className={styles.projectMain}>
          <img src={logoUrl} alt={project.project_name} className={styles.detailsLogo} />
          <div className={styles.projectInfo}>
            <h1 className={styles.detailsName}>{project.project_name}</h1>
            {project.link && (
              <a href={project.link} target="_blank" rel="noopener noreferrer" className={styles.projectSubtitle}>
                {project.link.substring(0, 35)}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className={styles.descriptionSection}>
        <h2 className={styles.sectionTitle}>Description</h2>
        <p className={styles.description}>{project.description || 'No description available'}</p>
      </div>

      <div className={styles.chartSection}>
        <h2 className={styles.sectionTitle}>Project Valuation (FDV)</h2>
        <ProjectChart projectId={projectId || ''} />
      </div>

      <div className={styles.timelineSection}>
        <div className={styles.timeline}>
        {project.rounds?.sort((a, b) => {
            if (!a.date && !b.date) return 0;
            if (!a.date) return 1;
            if (!b.date) return -1;
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          }).map((round: FundingRound, index: number) => (
            <div key={index} className={styles.timelineItem}>
              <div className={styles.timelineMarker} />
              <div 
                className={`${styles.roundCard} ${expandedRoundIndex === index ? styles.expanded : ''}`}
                onClick={() => handleRoundClick(index)}
              >
                <div className={styles.roundHeader}>
                  <span className={styles.roundTitle}>
                    {getRoundIcon(round.round_name)}
                    {round.date ? formatDate(round.date) + ' ' : ''}{round.round_name === 'Unknown' ? 'Round Unknown' : round.round_name}
                  </span>
                  <svg className={styles.expandIcon} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {expandedRoundIndex === index && (
                  <div className={styles.roundDetails}>
                    {round.amount_raised && (
                      <div className={styles.roundInfo}>
                        <span className={styles.infoLabel}>Amount Raised</span>
                        <span className={styles.infoValue}>${round.amount_raised.toLocaleString()}</span>
                      </div>
                    )}
                    {round.fully_diluted_valuation && (
                      <div className={styles.roundInfo}>
                        <span className={styles.infoLabel}>FDV</span>
                        <span className={styles.infoValue}>${round.fully_diluted_valuation.toLocaleString()}</span>
                      </div>
                    )}
                    {round.investors && round.investors.length > 0 && (
                      <div className={styles.investors}>
                        <span className={styles.infoLabel}>Investors</span>
                        <ul className={styles.investorsList}>
                          {round.investors.map((investor: string, i: number) => (
                            <li key={i} className={styles.investor}>{investor}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button 
        className={styles.placeBidButton}
        onClick={() => {
          console.log('Place RFQ button clicked', {
            projectId: project?.project_id,
            projectState: project,
            logo: project?.logo,
            navigationPath: `/place-rfq/${project?.project_id}`
          });
          
          if (!project?.project_id) {
            console.error('No project ID available');
            return;
          }
          
          WebApp.HapticFeedback.impactOccurred('light');
          try {
            navigate(`/place-rfq/${project.project_id}`, {
              state: {
                logo: project.logo,
                deal_type: project.rounds?.[0]?.round_name?.includes('Token') ? 'LIQUID_TOKEN' : 'EQUITY'
              }
            });
            console.log('Navigation completed');
          } catch (error) {
            console.error('Navigation failed:', error);
          }
        }}
      >
        Place Bid
      </button>
    </div>
  );
}; 