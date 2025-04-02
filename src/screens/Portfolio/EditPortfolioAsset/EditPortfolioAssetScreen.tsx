import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { useTelegram } from '../../../hooks/useTelegram';
import { apiService } from '../../../utils/api';
import { PortfolioAsset, UpdatePortfolioAssetRequest, ProjectSearchResult } from '../../../types/api';
import styles from './EditPortfolioAssetScreen.module.css';
import { Loader } from '../../../components/Loader';
import { parseNumberWithSuffix, formatMoney, formatNumberWithCommas } from '../../../utils/money';

// Format number with suffix without currency symbol
const displayNumberWithSuffix = (value: number | undefined): string => {
  if (value === undefined || value === null) return '';
  
  const formatted = formatMoney(value);
  // Remove the $ sign from the formatted money value
  return formatted.substring(1);
};

export const EditPortfolioAssetScreen: React.FC = () => {
  const navigate = useNavigate();
  const { isReady, webApp } = useTelegram();
  const { portfolioId, assetId } = useParams<{ portfolioId: string; assetId: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asset, setAsset] = useState<PortfolioAsset | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProjectSearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectSearchResult | null>(null);
  
  const [formData, setFormData] = useState<UpdatePortfolioAssetRequest>({
    project_name: '',
    date: new Date().toISOString().split('T')[0], // Set current date as default
    invested_amount: 0,
    terms: '',
    project_website: '',
    valuation: undefined,
    equity_or_tokens_amount: undefined
  });

  // Search for projects
  const searchProjects = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    try {
      setSearchLoading(true);
      const results = await apiService.searchProjects(query);
      setSearchResults(results);
      setShowSearchResults(true);
    } catch {
      WebApp.showAlert('Error searching projects. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Handle project selection
  const handleSelectProject = useCallback((project: ProjectSearchResult) => {
    setSelectedProject(project);
    setFormData(prev => ({
      ...prev,
      project_name: project.project_name,
      project_id: project.project_id
    }));
    setShowSearchResults(false);
    webApp?.HapticFeedback.impactOccurred('light');
  }, [webApp]);

  // Handle project selection change
  const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // If user clears project name, clear selected project
    if (!value) {
      setSelectedProject(null);
    }
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      project_name: value
    }));
    
    // Search for projects
    if (value) {
      searchProjects(value);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

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
      
      // Format date for input[type="date"]
      let dateValue = new Date().toISOString().split('T')[0]; // Default value - current date
      
      if (assetDetails.date) {
        // Convert date to YYYY-MM-DD format for input[type="date"]
        const date = new Date(assetDetails.date);
        if (!isNaN(date.getTime())) {
          dateValue = date.toISOString().split('T')[0];
        } else if (typeof assetDetails.date === 'string') {
          // If date is in YYYY-MM-DD format, use it as is
          if (assetDetails.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            dateValue = assetDetails.date;
          }
        }
      } else if (assetDetails.created_at) {
        // If no date, use creation date
        const date = new Date(assetDetails.created_at);
        if (!isNaN(date.getTime())) {
          dateValue = date.toISOString().split('T')[0];
        }
      }
      
      // Convert invested_amount to number if it's a string
      const investedAmount = typeof assetDetails.invested_amount === 'string' 
        ? parseFloat(assetDetails.invested_amount) 
        : assetDetails.invested_amount;
      
      // Initialize form data
      setFormData({
        project_name: assetDetails.project_name || assetDetails.project?.name || '',
        date: dateValue,
        invested_amount: investedAmount || 0,
        terms: assetDetails.terms || '',
        project_website: assetDetails.project_website || '',
        valuation: assetDetails.valuation,
        equity_or_tokens_amount: assetDetails.equity_or_tokens_amount,
        project_id: assetDetails.project_id
      });
      
      // Set initial project if exists
      if (assetDetails.project) {
        setSelectedProject({
          project_id: assetDetails.project.project_id || '',
          project_name: assetDetails.project.name || '',
          logo: assetDetails.project.logo || undefined
        });
      }
    } catch {
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
    
    // Format input values with commas for money fields
    if (name === 'invested_amount' || name === 'valuation' || name === 'equity_or_tokens_amount') {
      // First, normalize input by replacing comma separators with dots for decimal
      let processedValue = value;
      
      // If there's a comma that looks like a decimal separator (e.g. "1,5")
      // only allow one decimal separator and convert comma to dot
      if (processedValue.includes(',')) {
        // Find position of last comma
        const commaPos = processedValue.lastIndexOf(',');
        // If it looks like a decimal separator (followed by digits only)
        if (commaPos > 0 && /^\d+$/.test(processedValue.substring(commaPos + 1))) {
          // Replace comma with dot for decimal part
          processedValue = processedValue.substring(0, commaPos) + '.' + processedValue.substring(commaPos + 1);
        }
      }
      
      // Remove all commas to avoid confusion between thousand separators and decimal separators
      const numericValue = processedValue.replace(/,/g, '');
      
      // Update state with the raw value (without commas)
      setFormData(prev => ({
        ...prev,
        [name]: numericValue === '' ? undefined : numericValue
      }));
      
      // Update display with commas by setting the input value directly
      if (numericValue !== '') {
        // Only format if it's a valid number
        const isValid = /^-?\d*\.?\d*$/.test(numericValue);
        if (isValid) {
          e.target.value = formatNumberWithCommas(numericValue);
        }
      }
    } else {
      // For non-money fields, just update the state normally
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Validate and parse monetary input
  const validateMonetaryInput = (value: string): number | undefined => {
    if (!value) return undefined;
    
    // Check if the value has suffixes like k, m, b
    if (value.match(/^(-?\d*\.?\d+)(k|m|b)$/i)) {
      const parsedValue = parseNumberWithSuffix(value);
      return parsedValue !== null ? parsedValue : undefined;
    }
    
    // Otherwise try to parse as regular number
    const numValue = parseFloat(value);
    return !isNaN(numValue) ? numValue : undefined;
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
    
    // Parse monetary values before submission
    const investedAmount = typeof formData.invested_amount === 'string' 
      ? validateMonetaryInput(formData.invested_amount) 
      : formData.invested_amount;
      
    const valuation = typeof formData.valuation === 'string'
      ? validateMonetaryInput(formData.valuation)
      : formData.valuation;
      
    const equityAmount = typeof formData.equity_or_tokens_amount === 'string'
      ? validateMonetaryInput(formData.equity_or_tokens_amount)
      : formData.equity_or_tokens_amount;
    
    if (!investedAmount || investedAmount <= 0) {
      setError('Invested amount must be greater than 0');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      await apiService.updatePortfolioAsset(portfolioId, assetId, {
        ...formData,
        invested_amount: investedAmount,
        valuation: valuation,
        equity_or_tokens_amount: equityAmount,
        project_id: selectedProject?.project_id || formData.project_id
      });
      
      webApp?.HapticFeedback.notificationOccurred('success');
      WebApp.showAlert('Asset updated successfully!');
      
      // First remove loading state, then navigate
      setSubmitting(false);
      // Navigate back to portfolio screen
      navigate(`/portfolio/${portfolioId}`);
    } catch {
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
            {!selectedProject && !asset?.project_id && (
              <span className={styles.unpaired}>Unpaired</span>
            )}
          </label>
          <input
            id="project_name"
            name="project_name"
            type="text"
            className={styles.input}
            value={formData.project_name}
            onChange={handleProjectNameChange}
            placeholder="Search for a project or enter name"
            required
          />
          {searchLoading && (
            <div className={styles.searchLoading}>
              <Loader />
              <span>Searching projects...</span>
            </div>
          )}
          {showSearchResults && searchResults.length > 0 && (
            <div className={styles.searchResults}>
              {searchResults.map(project => (
                <div 
                  key={project.project_id}
                  className={styles.searchResultItem}
                  onClick={() => handleSelectProject(project)}
                >
                  {project.logo && (
                    <img 
                      src={project.logo} 
                      alt=""
                      className={styles.projectLogo}
                    />
                  )}
                  <span>{project.project_name}</span>
                </div>
              ))}
            </div>
          )}
          {showSearchResults && searchResults.length === 0 && searchQuery.trim() !== '' && !searchLoading && (
            <div className={styles.noResults}>
              No projects found. You can still use this name.
            </div>
          )}
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
            type="text"
            className={styles.input}
            value={typeof formData.invested_amount === 'number' 
              ? displayNumberWithSuffix(formData.invested_amount) 
              : formData.invested_amount || ''}
            onChange={handleInputChange}
            placeholder="Enter amount in USD (e.g. 500k, 1.5M, 2B)"
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
            type="text"
            className={styles.input}
            value={typeof formData.valuation === 'number'
              ? displayNumberWithSuffix(formData.valuation)
              : formData.valuation || ''}
            onChange={handleInputChange}
            placeholder="Enter valuation in USD (e.g. 5M, 10B)"
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
            value={typeof formData.equity_or_tokens_amount === 'number'
              ? displayNumberWithSuffix(formData.equity_or_tokens_amount)
              : formData.equity_or_tokens_amount || ''}
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
            type="text"
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