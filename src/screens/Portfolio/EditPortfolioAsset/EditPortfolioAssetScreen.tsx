import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { useTelegram } from '../../../hooks/useTelegram';
import { apiService } from '../../../utils/api';
import { PortfolioAsset, UpdatePortfolioAssetRequest } from '../../../types/api';
import styles from './EditPortfolioAssetScreen.module.css';
import { Loader } from '../../../components/Loader';

export const EditPortfolioAssetScreen: React.FC = () => {
  const navigate = useNavigate();
  const { isReady, webApp } = useTelegram();
  const { portfolioId, assetId } = useParams<{ portfolioId: string; assetId: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asset, setAsset] = useState<PortfolioAsset | null>(null);
  
  const [formData, setFormData] = useState<UpdatePortfolioAssetRequest>({
    project_name: '',
    date: new Date().toISOString().split('T')[0], // Устанавливаем текущую дату по умолчанию
    invested_amount: 0,
    terms: '',
    project_website: '',
    valuation: undefined,
    equity_or_tokens_amount: undefined
  });

  // Fetch asset details
  const fetchAssetDetails = useCallback(async () => {
    if (!portfolioId || !assetId) {
      setError('Portfolio ID or Asset ID is missing');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const assetDetails = await apiService.getPortfolioAssetById(portfolioId, assetId);
      setAsset(assetDetails);
      
      // Форматируем дату для input[type="date"]
      let dateValue = new Date().toISOString().split('T')[0]; // Значение по умолчанию - текущая дата
      
      if (assetDetails.date) {
        // Преобразуем дату в формат YYYY-MM-DD для input[type="date"]
        const date = new Date(assetDetails.date);
        if (!isNaN(date.getTime())) {
          dateValue = date.toISOString().split('T')[0];
        } else if (typeof assetDetails.date === 'string') {
          // Если дата в формате YYYY-MM-DD, используем её как есть
          if (assetDetails.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            dateValue = assetDetails.date;
          }
        }
      } else if (assetDetails.created_at) {
        // Если нет даты, используем дату создания
        const date = new Date(assetDetails.created_at);
        if (!isNaN(date.getTime())) {
          dateValue = date.toISOString().split('T')[0];
        }
      }
      
      console.log('Asset date value:', dateValue);
      
      // Initialize form data
      setFormData({
        project_name: assetDetails.project_name || assetDetails.project?.name || '',
        date: dateValue,
        invested_amount: assetDetails.invested_amount || parseFloat(assetDetails.tranche_size as string) || 0,
        terms: assetDetails.terms || '',
        project_website: assetDetails.project_website || '',
        valuation: assetDetails.valuation,
        equity_or_tokens_amount: assetDetails.equity_or_tokens_amount
      });
    } catch (err) {
      console.error('Error fetching asset details:', err);
      setError('Failed to load asset details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [portfolioId, assetId]);

  // Initialize
  useEffect(() => {
    if (isReady) {
      WebApp.ready();
      WebApp.expand();
      fetchAssetDetails();
    }
  }, [isReady, fetchAssetDetails]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'invested_amount' || name === 'valuation' || name === 'equity_or_tokens_amount'
        ? value === '' ? undefined : parseFloat(value)
        : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!portfolioId || !assetId) {
      setError('Portfolio ID or Asset ID is missing');
      return;
    }
    
    if (!formData.project_name) {
      setError('Project name is required');
      return;
    }
    
    if (!formData.date) {
      setError('Date is required');
      return;
    }
    
    if (!formData.invested_amount || formData.invested_amount <= 0) {
      setError('Invested amount must be greater than 0');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      await apiService.updatePortfolioAsset(portfolioId, assetId, formData);
      
      webApp?.HapticFeedback.notificationOccurred('success');
      WebApp.showAlert('Asset updated successfully!');
      
      // Сначала снимаем состояние загрузки, затем навигируем
      setSubmitting(false);
      // Navigate back to portfolio screen
      navigate(`/portfolio/${portfolioId}`);
    } catch (err) {
      console.error('Error updating portfolio asset:', err);
      setError('Failed to update portfolio asset. Please try again.');
      webApp?.HapticFeedback.notificationOccurred('error');
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    webApp?.HapticFeedback.impactOccurred('light');
    navigate(`/portfolio/${portfolioId}`);
  };

  const handleBack = () => {
    WebApp.HapticFeedback.impactOccurred('light');
    navigate(`/portfolio/${portfolioId}`);
  };

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <Loader />
        <p>Loading asset details...</p>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className={styles.errorContainer}>
        <h2>Asset Not Found</h2>
        <p>The asset you are looking for does not exist or you don't have permission to view it.</p>
        <button 
          className={styles.backButton}
          onClick={() => {
            webApp?.HapticFeedback.impactOccurred('light');
            navigate(`/portfolio/${portfolioId}`);
          }}
        >
          ←
        </button>
      </div>
    );
  }

  return (
    <div className={styles.editAssetScreen}>
      <div className={styles.headerContainer}>
        <button className={styles.backButton} onClick={handleBack}>
          ←
        </button>
        <h1 className={styles.screenTitle}>Edit Asset</h1>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <form className={styles.editAssetForm} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="project_name">
            Project Name<span className={styles.requiredMark}>*</span>
          </label>
          <input
            id="project_name"
            name="project_name"
            type="text"
            className={styles.input}
            value={formData.project_name}
            onChange={handleInputChange}
            placeholder="Enter project name"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="date">
            Date<span className={styles.requiredMark}>*</span>
          </label>
          <input
            id="date"
            name="date"
            type="date"
            className={styles.input}
            value={formData.date}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="invested_amount">
            Invested Amount ($)<span className={styles.requiredMark}>*</span>
          </label>
          <input
            id="invested_amount"
            name="invested_amount"
            type="number"
            step="0.01"
            min="0"
            className={styles.input}
            value={formData.invested_amount === null || formData.invested_amount === undefined ? '' : formData.invested_amount}
            onChange={handleInputChange}
            placeholder="Enter amount in USD"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="valuation">
            Valuation ($)
          </label>
          <input
            id="valuation"
            name="valuation"
            type="number"
            step="0.01"
            min="0"
            className={styles.input}
            value={formData.valuation === null || formData.valuation === undefined ? '' : formData.valuation}
            onChange={handleInputChange}
            placeholder="Enter valuation in USD"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="equity_or_tokens_amount">
            Equity/Tokens Amount
          </label>
          <input
            id="equity_or_tokens_amount"
            name="equity_or_tokens_amount"
            type="text"
            className={styles.input}
            value={formData.equity_or_tokens_amount === null || formData.equity_or_tokens_amount === undefined ? '' : formData.equity_or_tokens_amount}
            onChange={handleInputChange}
            placeholder="Enter equity percentage or token amount"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="terms">
            Terms
          </label>
          <input
            id="terms"
            name="terms"
            type="text"
            className={styles.input}
            value={formData.terms}
            onChange={handleInputChange}
            placeholder="Enter investment terms"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="project_website">
            Website
          </label>
          <input
            id="project_website"
            name="project_website"
            type="url"
            className={styles.input}
            value={formData.project_website}
            onChange={handleInputChange}
            placeholder="https://example.com"
          />
        </div>

        <div className={styles.formActions}>
          <button 
            type="button" 
            className={styles.cancelButton}
            onClick={handleCancel}
            disabled={submitting}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className={styles.loadingSpinner} />
                Saving...
              </>
            ) : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}; 