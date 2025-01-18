import React, { useState } from 'react';
import styles from './PlaceBidForm.module.css';
import { apiService } from '../../utils/api';
import { PlaceBidRequest } from '../../types/api';
import WebApp from '@twa-dev/sdk';

interface PlaceBidFormProps {
  orderId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PlaceBidForm: React.FC<PlaceBidFormProps> = ({ orderId, onSuccess, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PlaceBidRequest>({
    order_id: orderId,
    tranche_size: 0,
    valuation: 0,
    email: '',
    name: '',
    company: '',
    job_title: '',
    website: '',
    telegram_username: '',
    linkedin: '',
    x_username: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'tranche_size' || name === 'valuation' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await apiService.placeBid(formData);
      WebApp.HapticFeedback.impactOccurred('medium');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while placing the bid');
      WebApp.HapticFeedback.notificationOccurred('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label htmlFor="tranche_size">Tranche Size *</label>
        <input
          type="number"
          id="tranche_size"
          name="tranche_size"
          value={formData.tranche_size}
          onChange={handleChange}
          required
          min="0"
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="valuation">Valuation *</label>
        <input
          type="number"
          id="valuation"
          name="valuation"
          value={formData.valuation}
          onChange={handleChange}
          required
          min="0"
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="email">Email *</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="name">Name *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="company">Company</label>
        <input
          type="text"
          id="company"
          name="company"
          value={formData.company}
          onChange={handleChange}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="job_title">Job Title</label>
        <input
          type="text"
          id="job_title"
          name="job_title"
          value={formData.job_title}
          onChange={handleChange}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="website">Website</label>
        <input
          type="url"
          id="website"
          name="website"
          value={formData.website}
          onChange={handleChange}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="telegram_username">Telegram</label>
        <input
          type="text"
          id="telegram_username"
          name="telegram_username"
          value={formData.telegram_username}
          onChange={handleChange}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="linkedin">LinkedIn</label>
        <input
          type="url"
          id="linkedin"
          name="linkedin"
          value={formData.linkedin}
          onChange={handleChange}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="x_username">X (Twitter)</label>
        <input
          type="text"
          id="x_username"
          name="x_username"
          value={formData.x_username}
          onChange={handleChange}
        />
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.buttons}>
        <button 
          type="button" 
          className={styles.cancelButton} 
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Place Bid'}
        </button>
      </div>
    </form>
  );
}; 