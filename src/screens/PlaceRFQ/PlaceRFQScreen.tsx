import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styles from './PlaceRFQScreen.module.css';
import { apiService } from '../../utils/api';
import WebApp from '@twa-dev/sdk';
import { useTelegram } from '../../hooks/useTelegram';
import { Loader } from '../../components/Loader';
import { Project } from '../../types/api';

const parseNumberWithSuffix = (value: string): number | null => {
  // Remove all spaces and convert to lowercase
  const cleaned = value.replace(/\s+/g, '').toLowerCase();
  
  // Match number followed by optional suffix
  const match = cleaned.match(/^(-?\d*\.?\d+)(k|m|b)?$/);
  if (!match) return null;

  const [, num, suffix] = match;
  const baseValue = parseFloat(num);
  
  if (isNaN(baseValue)) return null;

  switch (suffix) {
    case 'k': return baseValue * 1000;
    case 'm': return baseValue * 1000000;
    case 'b': return baseValue * 1000000000;
    default: return baseValue;
  }
};

export const PlaceRFQScreen: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const logoFromState = location.state?.logo;
  const dealTypeFromState = location.state?.deal_type;
  console.log('Location state:', location.state);
  console.log('Deal type from state (raw):', dealTypeFromState);
  console.log('Deal type includes LIQUID_TOKEN:', dealTypeFromState?.includes('LIQUID_TOKEN'));
  const { isReady } = useTelegram();
  
  const [projectDetails, setProjectDetails] = useState<Project | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [formData, setFormData] = useState({
    project_id: projectId || '',
    tranche_size: '',
    valuation: '',
    type: 'Buy',
    terms: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState({
    tranche_size: '',
    valuation: ''
  });

  // Add logging at component mount
  useEffect(() => {
    console.log('PlaceRFQScreen mounted', {
      projectId,
      locationState: location.state,
      pathname: location.pathname,
      isReady
    });
  }, []);

  useEffect(() => {
    const loadProjectDetails = async () => {
      console.log('Starting loadProjectDetails:', { 
        projectId, 
        isReady,
        locationState: location.state,
        webAppState: {
          initData: WebApp.initData?.substring(0, 50),
          user: WebApp.initDataUnsafe?.user,
          isExpanded: WebApp.isExpanded,
          version: WebApp.version
        }
      });

      if (!projectId || !isReady) {
        console.log('Cannot load details - prerequisites not met:', { projectId, isReady });
        return;
      }
      
      setIsLoadingDetails(true);
      setError(null);

      try {
        console.log('Calling getProjectDetails with projectId:', projectId);
        const data = await apiService.getProjectById(projectId);
        console.log('API Response:', data);
        
        if (!data) {
          throw new Error('No data received from API');
        }

        console.log('Logo field from API:', {
          logo: data.logo,
          fullUrl: data.logo ? `https://nonprod.secondlane.io${data.logo}` : null
        });

        setProjectDetails(data);
        console.log('ProjectDetails set:', data);
        
        // Set deal type to BUY by default
        setFormData(prev => ({
          ...prev,
          type: 'BUY'
        }));
      } catch (err) {
        console.error('Error loading project details:', {
          error: err,
          message: err instanceof Error ? err.message : String(err),
          projectId,
          webAppState: {
            initData: WebApp.initData?.substring(0, 50),
            user: WebApp.initDataUnsafe?.user
          }
        });
        setError(err instanceof Error ? err.message : 'Failed to load project details');
        WebApp.HapticFeedback.notificationOccurred('error');
      } finally {
        setIsLoadingDetails(false);
      }
    };

    loadProjectDetails();
  }, [projectId, isReady]);

  const handleBack = () => {
    WebApp.HapticFeedback.impactOccurred('light');
    navigate(-1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = WebApp.initDataUnsafe?.user;
      if (!user) {
        throw new Error('User data is not available');
      }

      // Parse the numeric values before sending to API
      const trancheSize = parseNumberWithSuffix(formData.tranche_size);
      const valuation = parseNumberWithSuffix(formData.valuation);

      if (trancheSize === null || valuation === null) {
        throw new Error('Invalid number format');
      }

      await apiService.placeRFQ({
        ...formData,
        tranche_size: trancheSize,
        valuation: valuation,
        terms: formData.terms,
        type: formData.type as 'BUY' | 'SELL'
      });

      WebApp.showPopup({
        title: 'Success',
        message: 'Your inquiry has been placed successfully',
        buttons: [{ type: 'ok' }]
      });
      WebApp.HapticFeedback.notificationOccurred('success');
      navigate('/deals');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place inquiry');
      WebApp.HapticFeedback.notificationOccurred('error');
    } finally {
      setIsLoading(false);
    }
  };

  const validateField = (name: string, value: string) => {
    if (name === 'tranche_size') {
      const num = parseNumberWithSuffix(value);
      if (num === null) return 'Please enter a valid number (e.g. 1M, 500K, 2.5B)';
      if (num <= 0) return 'Size must be greater than 0';
      
    }
    if (name === 'valuation') {
      const num = parseNumberWithSuffix(value);
      if (num === null) return 'Please enter a valid number (e.g. 1M, 500K, 2.5B)';
      if (num <= 0) return 'Valuation must be greater than 0';
    }
    return '';
  };

  const handleFieldChange = (name: string, value: string) => {
    const error = validateField(name, value);
    const prevValue = formData[name as keyof typeof formData];
    
    // Add haptic feedback for any text change
    if (value !== prevValue) {
      WebApp.HapticFeedback.impactOccurred('light');
    }
    
    // Add haptic feedback for error
    if (error && !fieldErrors[name as keyof typeof fieldErrors]) {
      WebApp.HapticFeedback.notificationOccurred('warning');
    }
    
    setFieldErrors(prev => ({ ...prev, [name]: error }));
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (value: string) => {
    // Add light haptic feedback when changing type
    WebApp.HapticFeedback.selectionChanged();
    setFormData(prev => ({ ...prev, type: value }));
  };

  const isFormValid = () => {
    return formData.tranche_size !== '' && 
           formData.valuation !== '' && 
           !Object.values(fieldErrors).some(error => error !== '') &&
           !isLoading;
  };

  if (!isReady) {
    return (
      <div className={styles.container}>
        <Loader />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={handleBack}>
          <svg className={styles.backIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className={styles.title}>Place Inquiry</h1>
      </div>

      {isLoadingDetails ? (
        <div className={styles.loading}>
          <Loader />
        </div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : projectDetails && (
        <>
          <div className={styles.orderInfo}>
            <div className={styles.projectInfo}>
              <img 
                src={logoFromState || projectDetails?.logo || '/default-project-logo.svg'} 
                alt={projectDetails?.project_name}
                className={styles.projectLogo}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/default-project-logo.svg';
                }}
              />
              <div className={styles.projectDetails}>
                <h2 className={styles.projectName}>
                  {projectDetails.project_name}
                </h2>
                <div className={styles.projectMeta}>
                  {projectDetails?.rounds && projectDetails.rounds.length > 0 && (
                    <span className={styles.round}>{projectDetails.rounds[0].round_name}</span>
                  )}
                  {/* <span className={styles.assetType}>
                    {dealTypeFromState?.includes('LIQUID_TOKEN') ? 'Token' : 'Equity'}
                  </span> */}
                </div>
              </div>
            </div>

            <div className={styles.dealSummary}>
              <div className={styles.summaryRow}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>FDV</span>
                  <span className={styles.summaryValue}>
                    ${projectDetails.rounds?.[0]?.fully_diluted_valuation ? (projectDetails.rounds[0].fully_diluted_valuation / 1000000).toFixed(0) + 'M' : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formContent}>
              <div className={styles.orderIdSection}>
                <div className={styles.field}>
                  <label className={styles.label}>Order ID</label>
                  <input 
                    type="text"
                    className={styles.input}
                    value={formData.project_id}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, project_id: e.target.value }));
                      WebApp.HapticFeedback.impactOccurred('light');
                    }}
                    onKeyPress={() => WebApp.HapticFeedback.impactOccurred('light')}
                    disabled
                  />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.field}>
                  <label className={styles.label}>Tranche Size (USD)</label>
                  <input
                    type="text"
                    className={`${styles.input} ${fieldErrors.tranche_size ? styles.inputError : ''}`}
                    value={formData.tranche_size}
                    onChange={(e) => handleFieldChange('tranche_size', e.target.value)}
                    onKeyPress={() => WebApp.HapticFeedback.impactOccurred('light')}
                    onFocus={() => WebApp.HapticFeedback.impactOccurred('light')}
                    placeholder="Enter tranche size"
                    required
                  />
                  {fieldErrors.tranche_size && (
                    <span className={styles.fieldError}>{fieldErrors.tranche_size}</span>
                  )}
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Valuation (USD)</label>
                  <input
                    type="text"
                    className={`${styles.input} ${fieldErrors.valuation ? styles.inputError : ''}`}
                    value={formData.valuation}
                    onChange={(e) => handleFieldChange('valuation', e.target.value)}
                    onKeyPress={() => WebApp.HapticFeedback.impactOccurred('light')}
                    onFocus={() => WebApp.HapticFeedback.impactOccurred('light')}
                    placeholder="Enter valuation"
                    required
                  />
                  {fieldErrors.valuation && (
                    <span className={styles.fieldError}>{fieldErrors.valuation}</span>
                  )}
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Type</label>
                <select
                  className={styles.select}
                  value={formData.type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                >
                  <option value="Buy">Buy</option>
                  <option value="Sell">Sell</option>
                </select>
              </div>

              {error && <div className={styles.error}>{error}</div>}
            </div>

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={!isFormValid()}
              onClick={() => {
                if (isFormValid()) {
                  WebApp.HapticFeedback.impactOccurred('medium');
                }
              }}
            >
              {isLoading ? 'Submitting...' : 'Submit Inquiry'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}; 