import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { apiService } from '../../../utils/api';
import { CreatePortfolioAssetRequest, ProjectSearchResult } from '../../../types/api';
import styles from './CreatePortfolioAssetScreen.module.css';
import { Loader } from '../../../components/Loader';

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
    } catch (err) {
      console.error('Error searching projects:', err);
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
    
    if (name === 'project_name' && !selectedProject) {
      setSearchQuery(value);
    }
    
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
    
    if (!formData.invested_amount || formData.invested_amount <= 0) {
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
      
      // Отправляем данные без преобразования даты
      const apiData = {
        ...formData
      };
      
      console.log('Sending form data:', JSON.stringify(apiData, null, 2));
      const createdAsset = await apiService.createPortfolioAsset(portfolioId, apiData);
      console.log('Created asset:', JSON.stringify(createdAsset, null, 2));
      
      WebApp.HapticFeedback.notificationOccurred('success');
      WebApp.showAlert('Asset added successfully!');
      
      // Navigate back to portfolio screen
      navigate(`/portfolio`);
    } catch (err) {
      console.error('Error creating portfolio asset:', err);
      setError('Failed to create portfolio asset. Please try again.');
      WebApp.HapticFeedback.notificationOccurred('error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/portfolio');
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
                  <span>{project.project_name}</span>
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
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="invested_amount">
            Invested Amount (USD)*
          </label>
          <input
            id="invested_amount"
            name="invested_amount"
            type="number"
            step="0.01"
            min="0"
            className={styles.input}
            value={formData.invested_amount || ''}
            onChange={handleInputChange}
            placeholder="Enter amount in USD"
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
            type="number"
            step="0.01"
            min="0"
            className={styles.input}
            value={formData.valuation || ''}
            onChange={handleInputChange}
            placeholder="Enter valuation in USD (optional)"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="equity_or_tokens_amount">
            Equity/Tokens Amount
          </label>
          <input
            id="equity_or_tokens_amount"
            name="equity_or_tokens_amount"
            type="number"
            step="0.000001"
            min="0"
            className={styles.input}
            value={formData.equity_or_tokens_amount || ''}
            onChange={handleInputChange}
            placeholder="Enter amount of equity or tokens (optional)"
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
            type="url"
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