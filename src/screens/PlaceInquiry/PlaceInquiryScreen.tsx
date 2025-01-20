import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styles from './PlaceInquiryScreen.module.css';
import { apiService } from '../../utils/api';
import { OrderDetails } from '../../types/api';
import WebApp from '@twa-dev/sdk';
import { useTelegram } from '../../hooks/useTelegram';
import { Loader } from '../../components/Loader';

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

export const PlaceInquiryScreen: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const logoFromState = location.state?.logo;
  const dealTypeFromState = location.state?.deal_type;
  console.log('Location state:', location.state);
  console.log('Deal type from state (raw):', dealTypeFromState);
  console.log('Deal type includes LIQUID_TOKEN:', dealTypeFromState?.includes('LIQUID_TOKEN'));
  const { isReady } = useTelegram();
  
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [formData, setFormData] = useState({
    order_id: orderId || '',
    tranche_size: '',
    valuation: '',
    type: 'Buy'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState({
    tranche_size: '',
    valuation: ''
  });

  useEffect(() => {
    const loadOrderDetails = async () => {
      console.log('Starting loadOrderDetails:', { 
        orderId, 
        isReady,
        webAppState: {
          initData: WebApp.initData?.substring(0, 50),
          user: WebApp.initDataUnsafe?.user,
          isExpanded: WebApp.isExpanded,
          version: WebApp.version
        }
      });

      if (!orderId || !isReady) {
        console.log('Cannot load details - prerequisites not met:', { orderId, isReady });
        return;
      }
      
      setIsLoadingDetails(true);
      setError(null);

      try {
        console.log('Calling getOrderDetails with orderId:', orderId);
        const data = await apiService.getOrderDetails(orderId);
        console.log('API Response:', data);
        
        if (!data) {
          throw new Error('No data received from API');
        }

        console.log('Logo field from API:', {
          logo: data.logo,
          fullUrl: data.logo ? `https://nonprod.secondlane.io${data.logo}` : null
        });

        setOrderDetails(data);
        console.log('OrderDetails set:', data);
        
        // Set deal type based on received data
        if (data.type) {
          console.log('Setting form type:', data.type);
          setFormData(prev => ({
            ...prev,
            type: data.type === 'BUY' ? 'Sell' : 'Buy'
          }));
        }
      } catch (err) {
        console.error('Error loading order details:', {
          error: err,
          message: err instanceof Error ? err.message : String(err),
          orderId,
          webAppState: {
            initData: WebApp.initData?.substring(0, 50),
            user: WebApp.initDataUnsafe?.user
          }
        });
        setError(err instanceof Error ? err.message : 'Failed to load order details');
        WebApp.HapticFeedback.notificationOccurred('error');
      } finally {
        setIsLoadingDetails(false);
      }
    };

    loadOrderDetails();
  }, [orderId, isReady]);

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

      await apiService.placeBid({
        ...formData,
        tranche_size: trancheSize,
        valuation: valuation,
        name: user.first_name + (user.last_name ? ` ${user.last_name}` : ''),
        email: user.username ? `${user.username}@telegram.org` : `id${user.id}@telegram.org`
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
      if (orderDetails && num > orderDetails.offered_amount) {
        return 'Size cannot exceed available amount';
      }
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
      ) : orderDetails && (
        <>
          <div className={styles.orderInfo}>
            <div className={styles.projectInfo}>
              <img 
                src={logoFromState || orderDetails.logo || '/default-project-logo.svg'} 
                alt={orderDetails.project_name}
                className={styles.projectLogo}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/default-project-logo.svg';
                }}
              />
              <div className={styles.projectDetails}>
                <h2 className={styles.projectName}>{orderDetails.project_name}</h2>
                <div className={styles.projectMeta}>
                  {orderDetails.round && orderDetails.round !== 'Unknown' && (
                    <span className={styles.round}>{orderDetails.round}</span>
                  )}
                  <span className={styles.assetType}>
                    {dealTypeFromState?.includes('LIQUID_TOKEN') ? 'Token' : 'Equity'}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.dealSummary}>
              <div className={styles.summaryRow}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Amount</span>
                  <span className={styles.summaryValue}>
                    ${(orderDetails.offered_amount / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>FDV</span>
                  <span className={styles.summaryValue}>
                    ${(orderDetails.offered_fully_diluted_value / 1000000).toFixed(0)}M
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
                    value={formData.order_id}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, order_id: e.target.value }));
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
                    placeholder="Enter tranche size (e.g. 1M, 500K)"
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
                    placeholder="Enter valuation (e.g. 2.5M, 1B)"
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