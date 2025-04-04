import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { apiService } from '../../../utils/api';
import { CreatePortfolioAssetRequest, ProjectSearchResult } from '../../../types/api';
import styles from './CreatePortfolioAssetScreen.module.css';
import { Loader } from '../../../components/Loader';
import { parseNumberWithSuffix, formatNumberWithCommas } from '../../../utils/money';

export const CreatePortfolioAssetScreen: React.FC = () => {
  const navigate = useNavigate();
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const [loading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProjectSearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const [formData, setFormData] = useState<CreatePortfolioAssetRequest>({
    project_name: '',
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format for input[type="date"]
    invested_amount: 0,
    terms: '',
    project_website: '',
    valuation: undefined,
    equity_or_tokens_amount: undefined
  });
  
  const [selectedProject, setSelectedProject] = useState<ProjectSearchResult | null>(null);

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

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      searchProjects(searchQuery);
    }, 300);
    
    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, searchProjects]);

  // Handle project selection
  const handleSelectProject = (project: ProjectSearchResult) => {
    setSelectedProject(project);
    setFormData(prev => ({
      ...prev,
      project_id: project.project_id,
      project_name: project.project_name
    }));
    setShowSearchResults(false);
  };

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
      
      // Update search query if project_name is changed and no project is selected
      if (name === 'project_name' && !selectedProject) {
        setSearchQuery(value);
      }
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
    
    if (!portfolioId) {
      setError('Portfolio ID is missing');
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
    
    if (!formData.terms) {
      setError('Terms are required');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Send data with parsed values
      const apiData = {
        ...formData,
        invested_amount: investedAmount,
        valuation: valuation,
        equity_or_tokens_amount: equityAmount,
        project_id: selectedProject?.project_id || formData.project_id
      };
      
      await apiService.createPortfolioAsset(portfolioId, apiData);
      
      WebApp.HapticFeedback.notificationOccurred('success');
      WebApp.showAlert('Asset added successfully!');
      
      // Navigate back to portfolio detail screen
      navigate(`/portfolio/${portfolioId}`);
    } catch {
      setError('Failed to create portfolio asset. Please try again.');
      WebApp.HapticFeedback.notificationOccurred('error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(`/portfolio/${portfolioId}`);
  };

  // Handle back button click
  const handleBack = () => {
    navigate(`/portfolio/${portfolioId}`);
  };

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <Loader />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.createAssetScreen}>
      <div className={styles.headerContainer}>
        <button className={styles.backButton} onClick={handleBack}>
          ←
        </button>
        <h1 className={styles.screenTitle}>Add Portfolio Asset</h1>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <form className={styles.createAssetForm} onSubmit={handleSubmit}>
        <div className={styles.searchContainer}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="project_name">
              Project Name*
            </label>
            <div className={styles.searchInputContainer}>
              <input
                id="project_name"
                name="project_name"
                type="text"
                className={styles.input}
                value={formData.project_name}
                onChange={handleInputChange}
                placeholder="Enter project name or search"
                required
              />
              {searchLoading && <div className={styles.searchSpinner} />}
            </div>
          </div>
          
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
                  <span> {project.project_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="date">
            Date*
          </label>
          <input
            id="date"
            name="date"
            type="date"
            className={styles.input}
            value={formData.date}
            onChange={handleInputChange}
            required
            style={{
              colorScheme: 'light',
              WebkitAppearance: 'none',
              appearance: 'none',
              backgroundImage: 'url("data:image/svg+xml;utf8,<svg fill=\'gray\' height=\'24\' viewBox=\'0 0 24 24\' width=\'24\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/><path d=\'M0 0h24v24H0z\' fill=\'none\'/></svg>")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 10px center'
            }}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="invested_amount">
            Invested Amount (USD)*
          </label>
          <input
            id="invested_amount"
            name="invested_amount"
            type="text"
            className={styles.input}
            value={typeof formData.invested_amount === 'number' 
              ? formatNumberWithCommas(formData.invested_amount) 
              : formData.invested_amount || ''}
            onChange={handleInputChange}
            placeholder="Enter amount in USD (e.g. 500k, 1.5M, 2B)"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="valuation">
            Valuation (USD)
          </label>
          <input
            id="valuation"
            name="valuation"
            type="text"
            className={styles.input}
            value={typeof formData.valuation === 'number'
              ? formatNumberWithCommas(formData.valuation)
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
              ? formatNumberWithCommas(formData.equity_or_tokens_amount)
              : formData.equity_or_tokens_amount || ''}
            onChange={handleInputChange}
            placeholder="Enter amount of equity or tokens"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="terms">
            Terms*
          </label>
          <textarea
            id="terms"
            name="terms"
            className={styles.textarea}
            value={formData.terms || ''}
            onChange={handleInputChange}
            placeholder="Enter investment terms"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="project_website">
            Project Website
          </label>
          <input
            id="project_website"
            name="project_website"
            type="text"
            className={styles.input}
            value={formData.project_website || ''}
            onChange={handleInputChange}
            placeholder="Enter project website URL (optional)"
          />
        </div>

        <div className={styles.formActions}>
          <button 
            type="button" 
            className={styles.cancelButton}
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={submitting}
          >
            {submitting ? 'Adding...' : 'Add Asset'}
          </button>
        </div>
      </form>
    </div>
  );
}; 