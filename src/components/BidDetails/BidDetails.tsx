import React, { useEffect, useState, useCallback } from 'react';
import styles from './BidDetails.module.css';
import { apiService } from '../../utils/api';
import { BidDetails as IBidDetails } from '../../types/api';
import WebApp from '@twa-dev/sdk';
import { EditBidForm } from '../EditBidForm/EditBidForm';
import { Loader } from '../Loader';

interface BidDetailsProps {
  inquiryId: string;
  onBack: () => void;
}

export const BidDetails: React.FC<BidDetailsProps> = ({ inquiryId, onBack }) => {
  const [details, setDetails] = useState<IBidDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiService.getBidDetails(inquiryId);
      setDetails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading data');
      WebApp.HapticFeedback.notificationOccurred('error');
    } finally {
      setIsLoading(false);
    }
  }, [inquiryId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handleEditSuccess = () => {
    setIsEditing(false);
    loadDetails(); // Reload data after successful update
    WebApp.showPopup({
      title: 'Success',
      message: 'Bid successfully updated',
      buttons: [{ type: 'ok' }]
    });
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await apiService.deleteBid(inquiryId);
      WebApp.HapticFeedback.impactOccurred('medium');
      WebApp.showPopup({
        title: 'Success',
        message: 'Bid successfully deleted',
        buttons: [{
          type: 'ok',
          id: 'ok-delete'
        }]
      });
      onBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting bid');
      WebApp.HapticFeedback.notificationOccurred('error');
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = () => {
    WebApp.HapticFeedback.impactOccurred('light');
    WebApp.showConfirm(
      'Are you sure you want to delete this bid?',
      (confirmed) => {
        if (confirmed) {
          handleDelete();
        }
      }
    );
  };

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={onBack} className={styles.backButton}>
          Back
        </button>
      </div>
    );
  }

  if (!details) {
    return null;
  }

  if (isEditing) {
    return (
      <EditBidForm
        inquiryId={inquiryId}
        initialData={{
          tranche_size: details.data.tranche_size,
          valuation: details.data.valuation,
          type: details.data.type
        }}
        onSuccess={handleEditSuccess}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  const { data } = details;

  return (
    <div className={styles.bidDetails}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          Back
        </button>
        <h2 className={styles.title}>Bid Details</h2>
        <div className={styles.headerButtons}>
          <button 
            onClick={() => {
              WebApp.HapticFeedback.impactOccurred('light');
              setIsEditing(true);
            }}
            className={styles.editButton}
            disabled={isDeleting}
          >
            Edit
          </button>
          <button 
            onClick={confirmDelete}
            className={styles.deleteButton}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.row}>
          <span className={styles.label}>ID Bid</span>
          <span className={styles.value}>{data.inquiry_id}</span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>ID Order</span>
          <span className={styles.value}>{data.order_id}</span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Name</span>
          <span className={styles.value}>{data.name}</span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Email</span>
          <span className={styles.value}>{data.email}</span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Tranche Size</span>
          <span className={styles.value}>{data.tranche_size}</span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Valuation</span>
          <span className={styles.value}>{data.valuation}</span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Type</span>
          <span className={`${styles.value} ${styles.type} ${data.type === 'Buy' ? styles.buy : styles.sell}`}>
            {data.type}
          </span>
        </div>
      </div>
    </div>
  );
}; 