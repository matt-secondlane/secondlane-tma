import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../utils/api';
import type { NotificationSettings, NotificationPreference, NotificationEventType } from '../../types/api';
import styles from './NotificationSettingsScreen.module.css';
import { Loader } from '../../components/Loader/Loader';

export const NotificationSettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [eventTypes, setEventTypes] = useState<NotificationEventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);

  // Load data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Parallel loading of all data
        const [settingsData, preferencesData, eventTypesData] = await Promise.all([
          apiService.getNotificationSettings(),
          apiService.getNotificationPreferences(),
          apiService.getNotificationEventTypes(),
        ]);
        
        setSettings(settingsData);
        setPreferences(preferencesData);
        setEventTypes(eventTypesData);
        setEmail(settingsData.email);
        setError(null);
      } catch (err) {
        setError('Failed to load notification settings');
        console.error('Error fetching notification settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Reset success message after 3 seconds
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  // Toggle handler for main notification settings (auto-saves)
  const handleToggleSettings = async (type: 'telegram' | 'email') => {
    if (!settings) return;
    
    try {
      setIsUpdating(true);
      
      const updatedSettings = type === 'telegram' 
        ? { 
            ...settings, 
            telegram_notifications: !settings.telegram_notifications 
          }
        : { 
            ...settings, 
            email_notifications: !settings.email_notifications 
          };
      
      // Optimistically update UI
      setSettings(updatedSettings);
      
      // Send request to server
      const response = await apiService.updateNotificationSettings({
        telegram_notifications: updatedSettings.telegram_notifications,
        email_notifications: updatedSettings.email_notifications,
        email: updatedSettings.email
      });
      
      // If response is successful, update data from response
      setSettings(response);
    } catch (err) {
      console.error('Error updating notification settings:', err);
      // In case of error, revert to old value
      setSettings(settings);
    } finally {
      setIsUpdating(false);
    }
  };

  // Email change handler
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value || '');
    // Reset success message when typing
    if (saveSuccess) setSaveSuccess(false);
  };

  // Start editing email
  const handleEditEmail = () => {
    setEditingEmail(true);
  };

  // Cancel editing email
  const handleCancelEdit = () => {
    setEditingEmail(false);
    // Reset to original value
    if (settings) {
      setEmail(settings.email || '');
    }
  };

  // Save email handler
  const handleSaveEmail = async () => {
    if (!settings) return;
    
    try {
      setIsUpdating(true);
      
      const response = await apiService.updateNotificationSettings({
        telegram_notifications: settings.telegram_notifications,
        email_notifications: settings.email_notifications,
        email: email || undefined
      });
      
      setSettings(response);
      setSaveSuccess(true);
      setEditingEmail(false);
    } catch (err) {
      console.error('Error updating email:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Preference toggle handler for specific notification type (auto-saves)
  const handleTogglePreference = async (
    preference: NotificationPreference, 
    type: 'telegram' | 'email'
  ) => {
    try {
      setIsUpdating(true);
      
      const updatedPreference = type === 'telegram'
        ? { 
            ...preference, 
            telegram_enabled: !preference.telegram_enabled 
          }
        : { 
            ...preference, 
            email_enabled: !preference.email_enabled 
          };
      
      // Optimistically update UI
      setPreferences(prev => 
        prev.map(p => 
          p.id === preference.id ? updatedPreference : p
        )
      );
      
      // Send request to server
      const response = await apiService.updateNotificationPreference({
        event_type_id: preference.event_type.id,
        telegram_enabled: updatedPreference.telegram_enabled,
        email_enabled: updatedPreference.email_enabled
      });
      
      // If response is successful, update data from response
      setPreferences(prev => 
        prev.map(p => 
          p.id === preference.id ? response : p
        )
      );
    } catch (err) {
      console.error('Error updating notification preference:', err);
      // In case of error, revert to old settings
      setPreferences(prev => prev.map(p => p.id === preference.id ? preference : p));
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper for grouping notification types by category
  const getUniqueNotificationTypes = (): string[] => {
    const types = eventTypes.map(type => type.name || '');
    return [...new Set(types)];
  };

  // Get translated name for notification type
  const getNotificationTypeName = (typeName: string): string => {
    switch (typeName) {
      case 'in_app':
        return 'General Notifications';
      case 'new_deals':
        return 'New Deals';
      case 'portfolio_offers':
        return 'Asset Offers';
      case 'portfolio_updates':
        return 'Portfolio Updates';
      default:
        return typeName;
    }
  };

  // Get description for notification type
  const getNotificationTypeDescription = (typeName: string): string => {
    switch (typeName) {
      case 'in_app':
        return 'General in-app notifications';
      case 'new_deals':
        return 'Information about new deals and market offers';
      case 'portfolio_offers':
        return 'Offers to buy assets in your portfolio';
      case 'portfolio_updates':
        return 'Important updates and changes to assets in your portfolio';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <Loader />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          {error}
          <button 
            className={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={() => navigate('/notifications')}
        >
          ←
        </button>
        <h1 className={styles.title}>Notification Settings</h1>
      </div>
      
      <div className={styles.settingsContent}>
        {settings && (
          <div className={styles.settingsSection}>
            <h2 className={styles.sectionTitle}>Notification Channels</h2>
            
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <div className={styles.settingName}>In App</div>
                <div className={styles.settingDescription}>
                  Receive notifications in the app
                </div>
              </div>
              <div className={styles.settingStatus}>Always enabled</div>
            </div>
            
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <div className={styles.settingName}>Telegram</div>
                <div className={styles.settingDescription}>
                  Receive notifications via Telegram
                </div>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={settings.telegram_notifications}
                  onChange={() => handleToggleSettings('telegram')}
                  disabled={isUpdating}
                />
                <span className={styles.slider}></span>
              </label>
            </div>
            
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <div className={styles.settingName}>Email</div>
                <div className={styles.settingDescription}>
                  Receive notifications via email
                </div>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={settings.email_notifications}
                  onChange={() => handleToggleSettings('email')}
                  disabled={isUpdating}
                />
                <span className={styles.slider}></span>
              </label>
            </div>
            
            <div className={styles.emailSection}>
              <h3 className={styles.emailSectionTitle}>Email Address</h3>
              <div className={styles.emailDescription}>
                {editingEmail ? 'Edit your email address' : 'Add your email address for notifications'}
                {saveSuccess && <span className={styles.saveSuccess}> ✓ Email saved successfully</span>}
              </div>
              
              {!editingEmail && settings.email ? (
                <div className={styles.savedEmailContainer}>
                  <div className={styles.savedEmail}>
                    <div className={styles.emailInfo}>
                      <div className={styles.emailIcon}>✉️</div>
                      <div className={styles.emailValue}>{settings.email}</div>
                    </div>
                    <div className={styles.emailActions}>
                      <button 
                        className={styles.editEmailButton}
                        onClick={handleEditEmail}
                        disabled={isUpdating}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.emailInputContainer}>
                  <div className={styles.emailInputWrapper}>
                    <input
                      type="email"
                      className={styles.emailInput}
                      value={email || ''}
                      onChange={handleEmailChange}
                      placeholder="Your email address"
                      disabled={isUpdating}
                    />
                    <div className={styles.emailButtonGroup}>
                      {editingEmail && (
                        <button 
                          className={styles.cancelButton}
                          onClick={handleCancelEdit}
                          disabled={isUpdating}
                        >
                          Cancel
                        </button>
                      )}
                      <button 
                        className={styles.saveButton}
                        onClick={handleSaveEmail}
                        disabled={isUpdating || (email === settings?.email && editingEmail) || !email?.trim()}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {preferences.length > 0 && (
          <div className={styles.preferencesSection}>
            <h2 className={styles.sectionTitle}>Notification Types</h2>
            
            {getUniqueNotificationTypes().map(type => {
              const typePreferences = preferences.filter(
                p => p.event_type.code.startsWith(type)
              );
              
              if (typePreferences.length === 0) return null;
              
              return (
                <div key={type} className={styles.notificationTypeGroup}>
                  <div className={styles.notificationTypeHeader}>
                    {getNotificationTypeName(type)}
                  </div>
                  <div className={styles.notificationTypeDescription}>
                    {getNotificationTypeDescription(type)}
                  </div>
                  
                  {typePreferences.map(preference => (
                    <div key={preference.id} className={styles.preferenceItem}>
                      <div className={styles.preferenceName}>
                        {preference.event_type.name}
                      </div>
                      
                      <div className={styles.preferenceToggles}>
                        <div className={styles.preferenceToggle}>
                          <label className={styles.toggleLabel}>In App</label>
                          <div className={styles.alwaysEnabled}>✓</div>
                        </div>
                        
                        <div className={styles.preferenceToggle}>
                          <label className={styles.toggleLabel}>Telegram</label>
                          <label className={styles.switch}>
                            <input
                              type="checkbox"
                              checked={preference.telegram_enabled}
                              onChange={() => handleTogglePreference(preference, 'telegram')}
                              disabled={isUpdating || !settings?.telegram_notifications}
                            />
                            <span className={styles.slider}></span>
                          </label>
                        </div>
                        
                        <div className={styles.preferenceToggle}>
                          <label className={styles.toggleLabel}>Email</label>
                          <label className={styles.switch}>
                            <input
                              type="checkbox"
                              checked={preference.email_enabled}
                              onChange={() => handleTogglePreference(preference, 'email')}
                              disabled={isUpdating || !settings?.email_notifications}
                            />
                            <span className={styles.slider}></span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};