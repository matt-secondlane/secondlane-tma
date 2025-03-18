import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../../hooks/useTelegram';
import { apiService } from '../../utils/api';
import styles from './AttestationScreen.module.css';
import { Loader } from '../../components/Loader';
import Select, { StylesConfig } from 'react-select';
import ReactCountryFlag from 'react-country-flag';
import { getData } from 'country-list';

// Types for attestation form
type IncomeOption = 'yes' | 'no' | '';
type JointIncomeOption = 'yes' | 'no' | '';
type NetWorthOption = 'yes' | 'no' | '';
type AffirmationOption = boolean;

interface AttestationFormData {
  attestationYear: number;
  individualIncome: IncomeOption;
  jointIncome: JointIncomeOption;
  netWorth: NetWorthOption;
  affirmation: AffirmationOption;
  country: string;
  email: string;
}

// Props for the AttestationScreen component
interface AttestationScreenProps {
  onAttestationComplete?: () => void;
}

// Custom country option type for react-select
interface CountryOption {
  value: string;
  label: string;
  code: string;
}

// Convert country-list data to react-select options with flags
const getCountryOptions = (): CountryOption[] => {
  const countries = getData();
  return countries.map(country => ({
    value: country.name,
    label: country.name,
    code: country.code
  }));
};

// Country options for the dropdown
const COUNTRY_OPTIONS: CountryOption[] = getCountryOptions();

// Current year for attestation
const CURRENT_YEAR = new Date().getFullYear();

export const AttestationScreen: React.FC<AttestationScreenProps> = ({ onAttestationComplete }) => {
  const navigate = useNavigate();
  const { isReady, webApp } = useTelegram();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attestationStatus, setAttestationStatus] = useState<'attested_accredited' | 'attested_not_accredited' | 'not_attested' | 'pending' | null>(null);
  const [attestationYear, setAttestationYear] = useState<number | null>(null);
  const [formStep, setFormStep] = useState(1);
  const [animateDirection, setAnimateDirection] = useState<'next' | 'prev'>('next');
  
  const [formData, setFormData] = useState<AttestationFormData>({
    attestationYear: CURRENT_YEAR,
    individualIncome: '',
    jointIncome: '',
    netWorth: '',
    affirmation: false,
    country: '',
    email: ''
  });

  const [formErrors, setFormErrors] = useState({
    attestationYear: false,
    individualIncome: false,
    jointIncome: false,
    netWorth: false,
    affirmation: false,
    country: false,
    email: false
  });

  // Check attestation status
  const checkAttestationStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getAttestationStatus();
      console.log('Attestation status:', response);
      
      if (response.has_attestation) {
        if (response.is_accredited) {
          setAttestationStatus('attested_accredited');
        } else {
          setAttestationStatus('attested_not_accredited');
          // If user is attested but not accredited, show appropriate message
        }
        
        // Save the latest attestation year
        if (response.latest_attestation_year) {
          setAttestationYear(response.latest_attestation_year);
        }
      } else {
        setAttestationStatus('not_attested');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error checking attestation status:', err);
      setError('Failed to check attestation status. Please try again.');
      setAttestationStatus('not_attested');
      setLoading(false);
    }
  }, []);

  // Check attestation status on load
  useEffect(() => {
    if (isReady) {
      checkAttestationStatus();
    }
  }, [isReady, checkAttestationStatus]);

  // Form field change handlers
  const handleIndividualIncomeChange = (value: IncomeOption) => {
    setFormData(prev => ({ ...prev, individualIncome: value }));
    setFormErrors(prev => ({ ...prev, individualIncome: false }));
  };

  const handleJointIncomeChange = (value: JointIncomeOption) => {
    setFormData(prev => ({ ...prev, jointIncome: value }));
    setFormErrors(prev => ({ ...prev, jointIncome: false }));
  };

  const handleNetWorthChange = (value: NetWorthOption) => {
    setFormData(prev => ({ ...prev, netWorth: value }));
    setFormErrors(prev => ({ ...prev, netWorth: false }));
  };

  const handleAffirmationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, affirmation: e.target.checked }));
    setFormErrors(prev => ({ ...prev, affirmation: false }));
  };

  const handleCountryChange = (selectedOption: CountryOption | null) => {
    setFormData(prev => ({ ...prev, country: selectedOption ? selectedOption.value : '' }));
    setFormErrors(prev => ({ ...prev, country: false }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, email: e.target.value }));
    setFormErrors(prev => ({ ...prev, email: false }));
  };

  // Styles for the country select component
  const countrySelectStyles: StylesConfig<CountryOption, false> = {
    control: (provided, state) => ({
      ...provided,
      padding: '10px',
      borderRadius: '12px',
      border: formErrors.country ? '2px solid #F44336' : 'none',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(75, 79, 71, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
      backgroundColor: 'var(--tg-theme-bg-color)',
      color: 'var(--tg-theme-text-color)',
      fontSize: '16px',
      cursor: 'pointer',
      '&:hover': {
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)'
      },
      transition: 'all 0.3s ease'
    }),
    option: (provided, state) => ({
      ...provided,
      padding: '14px 12px',
      backgroundColor: state.isSelected 
        ? 'rgba(75, 79, 71, 0.1)' 
        : state.isFocused 
          ? 'rgba(75, 79, 71, 0.05)' 
          : 'var(--tg-theme-bg-color)',
      color: 'var(--tg-theme-text-color)',
      cursor: 'pointer',
      borderRadius: '6px',
      margin: '2px 4px',
      display: 'flex',
      alignItems: 'center'
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: 'var(--tg-theme-bg-color)',
      border: '1px solid rgba(75, 79, 71, 0.1)',
      borderRadius: '12px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
      zIndex: 100
    }),
    menuList: (provided) => ({
      ...provided,
      padding: '10px',
      maxHeight: '250px',
      '&::-webkit-scrollbar': {
        width: '0px',
        height: '0px'
      },
      scrollbarWidth: 'none',
      msOverflowStyle: 'none'
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'var(--tg-theme-text-color)'
    }),
    input: (provided) => ({
      ...provided,
      color: 'var(--tg-theme-text-color)'
    }),
    indicatorSeparator: () => ({
      display: 'none'
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: 'var(--tg-theme-hint-color)'
    })
  };

  // Custom formatting for the country option with flag
  const formatCountryOption = (option: CountryOption) => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <ReactCountryFlag 
        countryCode={option.code} 
        svg 
        style={{
          width: '1.5em',
          height: '1.5em',
          marginRight: '10px',
          borderRadius: '50%',
          objectFit: 'cover'
        }}
      />
      {option.label}
    </div>
  );

  // Form navigation
  const nextStep = () => {
    if (formStep === 1) {
      if (formData.individualIncome === '') {
        setFormErrors(prev => ({ ...prev, individualIncome: true }));
        webApp?.HapticFeedback.notificationOccurred('error');
        return;
      }
      
      if (formData.jointIncome === '') {
        setFormErrors(prev => ({ ...prev, jointIncome: true }));
        webApp?.HapticFeedback.notificationOccurred('error');
        return;
      }
      
      if (formData.netWorth === '') {
        setFormErrors(prev => ({ ...prev, netWorth: true }));
        webApp?.HapticFeedback.notificationOccurred('error');
        return;
      }
    }
    
    webApp?.HapticFeedback.impactOccurred('light');
    setAnimateDirection('next');
    setFormStep(prev => prev + 1);
  };

  const prevStep = () => {
    if (formStep > 1) {
      webApp?.HapticFeedback.impactOccurred('light');
      setAnimateDirection('prev');
      setFormStep(prev => prev - 1);
    }
  };

  // Enhanced email validation function
  const isValidEmail = (email: string): boolean => {
    // More strict email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  // Handler for submit button click when it's inactive
  const handleSubmitButtonClick = () => {
    // If the form is not ready yet, show errors but don't submit
    if (formStep === 2) {
      const errors = {
        country: formData.country === '',
        email: !formData.email || !isValidEmail(formData.email),
        affirmation: !formData.affirmation
      };
      
      setFormErrors(prev => ({ 
        ...prev, 
        country: errors.country,
        email: errors.email,
        affirmation: errors.affirmation
      }));
      
      webApp?.HapticFeedback.notificationOccurred('error');
    }
  };

  // Function to get detailed email error message
  const getEmailErrorMessage = (email: string): string => {
    if (!email) {
      return 'Email address is required';
    }
    
    if (!email.includes('@')) {
      return 'Email must contain @ symbol';
    }
    
    const [localPart, domainPart] = email.split('@');
    
    if (!localPart || localPart.length === 0) {
      return 'Email must have a username before @';
    }
    
    if (!domainPart || domainPart.length === 0) {
      return 'Email must have a domain after @';
    }
    
    if (!domainPart.includes('.')) {
      return 'Email domain must include a dot (example.com)';
    }
    
    const domainExtension = domainPart.split('.').pop();
    if (!domainExtension || domainExtension.length < 2) {
      return 'Email must have a valid domain extension (.com, .org, etc.)';
    }
    
    if (/[^\w.%+-]/.test(localPart)) {
      return 'Email username contains invalid characters';
    }
    
    return 'Please enter a valid email address';
  };

  // Updated form validation function
  const validateForm = (): boolean => {
    const errors = {
      attestationYear: !formData.attestationYear,
      individualIncome: formData.individualIncome === '',
      jointIncome: formData.jointIncome === '',
      netWorth: formData.netWorth === '',
      affirmation: !formData.affirmation, // Must be checked
      country: formData.country === '',
      email: !formData.email || !isValidEmail(formData.email)
    };
    
    setFormErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      webApp?.HapticFeedback.notificationOccurred('error');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      webApp?.HapticFeedback.impactOccurred('medium');
      
      const response = await apiService.submitAttestation({
        attestation_year: formData.attestationYear,
        individual_income_test: formData.individualIncome === 'yes',
        joint_income_test: formData.jointIncome === 'yes',
        net_worth_test: formData.netWorth === 'yes',
        affirmation: formData.affirmation,
        country: formData.country,
        email: formData.email
      });
      
      console.log('Attestation submitted:', response);
      
      if (response.success) {
        // Check attestation status after successful submission
        const statusResponse = await apiService.getAttestationStatus();
        console.log('Updated attestation status:', statusResponse);
        
        if (statusResponse.has_attestation) {
          if (statusResponse.is_accredited) {
            setAttestationStatus('attested_accredited');
            // Call the onAttestationComplete callback if provided
            if (onAttestationComplete) {
              // Wait a moment to show the success message before redirecting
              setTimeout(() => {
                onAttestationComplete();
              }, 1500);
            }
          } else {
            setAttestationStatus('attested_not_accredited');
            if (statusResponse.latest_attestation_year) {
              setAttestationYear(statusResponse.latest_attestation_year);
            }
          }
        } else {
          // If status hasn't updated for some reason, show pending
          setAttestationStatus('pending');
        }
        
        webApp?.HapticFeedback.notificationOccurred('success');
        
        // If user is accredited, redirect to main screen
        if (statusResponse.has_attestation && statusResponse.is_accredited) {
          setTimeout(() => {
            navigate('/');
          }, 2000);
        }
      } else {
        setError(response.message || 'Failed to submit attestation. Please try again.');
        webApp?.HapticFeedback.notificationOccurred('error');
        setSubmitting(false);
      }
      
    } catch (err) {
      console.error('Error submitting attestation:', err);
      setError('Failed to submit attestation. Please try again.');
      webApp?.HapticFeedback.notificationOccurred('error');
      setSubmitting(false);
    }
  };

  // Render progress bar
  const renderProgressBar = () => {
    return (
      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${(formStep / 2) * 100}%` }}
          />
        </div>
        <div className={styles.progressSteps}>
          <div className={`${styles.progressStep} ${formStep >= 1 ? styles.activeStep : ''}`}>1</div>
          <div className={`${styles.progressStep} ${formStep >= 2 ? styles.activeStep : ''}`}>2</div>
        </div>
      </div>
    );
  };

  // Render income questions form
  const renderIncomeForm = () => {
    // Check if all three fields are selected
    const allFieldsSelected = formData.individualIncome !== '' && 
                             formData.jointIncome !== '' && 
                             formData.netWorth !== '';
                             
    return (
      <div className={`${styles.formContent} ${styles[`animate-${animateDirection}`]}`}>
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Do you have an annual income exceeding $200,000 (individual)?
          </label>
          <div className={styles.radioGroup}>
            <div 
              className={`${styles.radioOption} ${formData.individualIncome === 'yes' ? styles.selected : ''}`}
              onClick={() => handleIndividualIncomeChange('yes')}
            >
              <div className={styles.radioButton}>
                {formData.individualIncome === 'yes' && <div className={styles.radioButtonInner} />}
              </div>
              <span>Yes</span>
            </div>
            <div 
              className={`${styles.radioOption} ${formData.individualIncome === 'no' ? styles.selected : ''}`}
              onClick={() => handleIndividualIncomeChange('no')}
            >
              <div className={styles.radioButton}>
                {formData.individualIncome === 'no' && <div className={styles.radioButtonInner} />}
              </div>
              <span>No</span>
            </div>
          </div>
          {formErrors.individualIncome && <div className={styles.fieldError}>Please select an option</div>}
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Do you have a joint annual income exceeding $300,000 (with spouse)?
          </label>
          <div className={styles.radioGroup}>
            <div 
              className={`${styles.radioOption} ${formData.jointIncome === 'yes' ? styles.selected : ''}`}
              onClick={() => handleJointIncomeChange('yes')}
            >
              <div className={styles.radioButton}>
                {formData.jointIncome === 'yes' && <div className={styles.radioButtonInner} />}
              </div>
              <span>Yes</span>
            </div>
            <div 
              className={`${styles.radioOption} ${formData.jointIncome === 'no' ? styles.selected : ''}`}
              onClick={() => handleJointIncomeChange('no')}
            >
              <div className={styles.radioButton}>
                {formData.jointIncome === 'no' && <div className={styles.radioButtonInner} />}
              </div>
              <span>No</span>
            </div>
          </div>
          {formErrors.jointIncome && <div className={styles.fieldError}>Please select an option</div>}
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Do you have a net worth exceeding $1 million (excluding primary residence)?
          </label>
          <div className={styles.radioGroup}>
            <div 
              className={`${styles.radioOption} ${formData.netWorth === 'yes' ? styles.selected : ''}`}
              onClick={() => handleNetWorthChange('yes')}
            >
              <div className={styles.radioButton}>
                {formData.netWorth === 'yes' && <div className={styles.radioButtonInner} />}
              </div>
              <span>Yes</span>
            </div>
            <div 
              className={`${styles.radioOption} ${formData.netWorth === 'no' ? styles.selected : ''}`}
              onClick={() => handleNetWorthChange('no')}
            >
              <div className={styles.radioButton}>
                {formData.netWorth === 'no' && <div className={styles.radioButtonInner} />}
              </div>
              <span>No</span>
            </div>
          </div>
          {formErrors.netWorth && <div className={styles.fieldError}>Please select an option</div>}
        </div>

        <div className={styles.navigationButtons}>
          <button 
            type="button" 
            className={`${styles.nextButton} ${allFieldsSelected ? styles.activeButton : ''}`}
            onClick={nextStep}
          >
            Continue
          </button>
        </div>
      </div>
    );
  };

  // Render personal info form
  const renderPersonalInfoForm = () => {
    // Check if all required fields in the personal info form are completed
    const allPersonalInfoComplete = 
      formData.country !== '' && 
      formData.email !== '' && 
      isValidEmail(formData.email) && 
      formData.affirmation === true;

    // Find the selected country option
    const selectedCountry = COUNTRY_OPTIONS.find(option => option.value === formData.country);
      
    return (
      <div className={`${styles.formContent} ${styles[`animate-${animateDirection}`]}`}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="country">
            Country of Origin
          </label>
          <div className={styles.countrySelectWrapper}>
            <Select<CountryOption>
              id="country"
              className={styles.countrySelect}
              options={COUNTRY_OPTIONS}
              value={selectedCountry || null}
              onChange={handleCountryChange}
              formatOptionLabel={formatCountryOption}
              styles={countrySelectStyles}
              placeholder="Select your country"
              isClearable={false}
              isSearchable={true}
            />
          </div>
          {formErrors.country && <div className={styles.fieldError}>Please select your country</div>}
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            className={`${styles.input} ${formErrors.email ? styles.inputError : ''}`}
            value={formData.email}
            onChange={handleEmailChange}
            placeholder="Enter your email address"
          />
          {formErrors.email && <div className={styles.fieldError}>
            {getEmailErrorMessage(formData.email)}
          </div>}
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Confirmation
          </label>
          <div className={styles.checkboxContainer}>
            <input
              type="checkbox"
              id="affirmation"
              className={styles.checkbox}
              checked={formData.affirmation}
              onChange={handleAffirmationChange}
            />
            <label htmlFor="affirmation" className={styles.checkboxLabel}>
              I affirm that the information provided is true and accurate
            </label>
          </div>
          {formErrors.affirmation && <div className={styles.fieldError}>You must affirm that the information is true</div>}
        </div>

        <div className={styles.navigationButtons}>
          <button 
            type="button" 
            className={styles.backButton}
            onClick={prevStep}
          >
            Back
          </button>
          <button 
            type="submit" 
            className={`${styles.submitButton} ${allPersonalInfoComplete ? styles.activeButton : ''}`}
            disabled={submitting}
            onClick={!allPersonalInfoComplete ? handleSubmitButtonClick : undefined}
          >
            {submitting ? 'Submitting...' : 'Submit Attestation'}
          </button>
        </div>
      </div>
    );
  };

  // Render content based on status
  const renderContent = () => {
    if (loading) {
      return (
        <div className={styles.loaderContainer}>
          <Loader />
          <p className={styles.loadingText}>Checking attestation status...</p>
        </div>
      );
    }
    
    if (attestationStatus === 'attested_accredited') {
      return (
        <div className={styles.successContainer}>
          <div className={styles.successIcon}>✓</div>
          <h2 className={styles.successTitle}>You are attested and accredited</h2>
          <p className={styles.successText}>Redirecting to the main screen...</p>
        </div>
      );
    }
    
    if (attestationStatus === 'attested_not_accredited') {
      return (
        <div className={styles.warningContainer}>
          <div className={styles.warningIcon}>⚠️</div>
          <h2 className={styles.warningTitle}>You are attested but not accredited</h2>
          <p className={styles.warningText}>
            Your attestation for {attestationYear} has been accepted, but you do not meet the criteria for an accredited investor.
            This may limit your access to certain investment opportunities.
          </p>
          <button 
            className={styles.continueButton}
            onClick={() => navigate('/')}
          >
            Continue
          </button>
        </div>
      );
    }
    
    if (attestationStatus === 'pending') {
      return (
        <div className={styles.successContainer}>
          <div className={styles.pendingIcon}>⏳</div>
          <h2 className={styles.successTitle}>Attestation Submitted</h2>
          <p className={styles.successText}>Your attestation is being processed. You will be redirected to the main screen.</p>
        </div>
      );
    }
    
    return (
      <form className={styles.form} onSubmit={handleSubmit}>
        <div>
          <h1 className={styles.title}>Investor Attestation</h1>
          <p className={styles.description}>
            Please complete this form to verify your accredited investor status.
          </p>
        </div>
        
        {error && <div className={styles.error}>{error}</div>}
        
        {renderProgressBar()}
        
        {formStep === 1 && renderIncomeForm()}
        {formStep === 2 && renderPersonalInfoForm()}
      </form>
    );
  };

  return (
    <div className={styles.container}>
      {renderContent()}
    </div>
  );
}; 