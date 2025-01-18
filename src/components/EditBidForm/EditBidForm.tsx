import React, { useState } from 'react';
import styles from './EditBidForm.module.css';
import { apiService } from '../../utils/api';
import { UpdateBidRequest } from '../../types/api';
import WebApp from '@twa-dev/sdk';

interface EditBidFormProps {
  inquiryId: string;
  initialData: {
    tranche_size: number;
    valuation: number;
    type: 'Buy' | 'Sell';
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditBidForm: React.FC<EditBidFormProps> = ({ 
  inquiryId, 
  initialData,
  onSuccess, 
  onCancel 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateBidRequest>({
    inquiry_id: inquiryId,
    tranche_size: initialData.tranche_size,
    valuation: initialData.valuation,
    type: initialData.type
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      await apiService.updateBid({
        inquiry_id: inquiryId,
        tranche_size: Number(formData.tranche_size),
        valuation: Number(formData.valuation),
        type: formData.type
      });
      
      WebApp.showAlert('Bid successfully updated');
      onSuccess();
    } catch (error) {
      console.error('Error updating bid:', error);
      WebApp.showAlert('Error updating bid');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label htmlFor="tranche_size">Tranche Size</label>
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
        <label htmlFor="valuation">Valuation</label>
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
        <label htmlFor="type">Type</label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          required
        >
          <option value="Buy">Buy</option>
          <option value="Sell">Sell</option>
        </select>
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
          {isLoading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}; 