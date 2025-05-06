import api from '../services/api';
import type { 
  BidsQueryParams, 
  BidsResponse, 
  PlaceBidRequest, 
  PlaceBidResponse,
  BidDetails,
  UpdateBidRequest,
  UpdateBidResponse,
  ProjectsQueryParams,
  ProjectsResponse,
  Project,
  OrderbookResponse,
  OrderDetails,
  PlaceRFQRequest,
  PlaceRFQResponse,
  RFQDetails,
  UpdateRFQRequest,
  UpdateRFQResponse,
  ProjectGraphResponse,
  AttestationStatus,
  AttestationRequest,
  AttestationResponse,
  Attestation,
  Portfolio,
  CreatePortfolioRequest,
  UpdatePortfolioRequest,
  PortfolioAsset,
  CreatePortfolioAssetRequest,
  UpdatePortfolioAssetRequest,
  ProjectSearchResult,
  ProjectSearchResponse,
  NotificationSettings,
  NotificationEventType,
  NotificationPreference,
  Notification,
  PortfolioSummary,
  PortfolioGraphResponse,
  AssetSummary,
  AssetGraphResponse,
  CSVPortfolioResponse,
  ProjectUnlockResponse,
  PortfolioUnlocksResponse,
  PortfolioUnlockSummaryResponse,
  PortfolioUnlockAllocationsResponse
} from '../types/api';

export const apiService = {
  // Get list of bids
  async getBids(params: BidsQueryParams): Promise<BidsResponse> {
    const response = await api.get('/bids', { params });
    return response.data;
  },

  // Place bid
  async placeBid(data: PlaceBidRequest): Promise<PlaceBidResponse> {
    const response = await api.post('/bids', data);
    return response.data;
  },

  // Get bid details
  async getBidDetails(inquiryId: string): Promise<BidDetails> {
    const response = await api.get(`/bids/${inquiryId}`);
    return response.data;
  },

  // Update bid
  async updateBid(data: UpdateBidRequest): Promise<UpdateBidResponse> {
    const response = await api.put(`/bids/${data.inquiry_id}`, data);
    return response.data;
  },

  // Delete bid
  async deleteBid(inquiryId: string): Promise<void> {
    await api.delete(`/bids/${inquiryId}`);
  },

  // Get list of projects
  async getProjects(params: ProjectsQueryParams): Promise<ProjectsResponse> {
    const response = await api.get('/projects', { params });
    return response.data;
  },

  // Get project details
  async getProjectById(id: string): Promise<Project> {
    const response = await api.get(`/projects/${id}`);
    return response.data.data;
  },

  // Place RFQ
  async placeRFQ(data: PlaceRFQRequest): Promise<PlaceRFQResponse> {
    const response = await api.post('/rfq', data);
    return response.data;
  },

  // Get RFQ details
  async getRFQDetails(rfqId: string): Promise<RFQDetails> {
    const response = await api.get(`/rfq/${rfqId}`);
    return response.data;
  },

  // Update RFQ
  async updateRFQ(data: UpdateRFQRequest): Promise<UpdateRFQResponse> {
    const response = await api.put(`/rfq/${data.rfq_id}`, data);
    return response.data;
  },

  // Get orderbook
  getOrderbook: (params: BidsQueryParams): Promise<OrderbookResponse> => {
    return api.get('/orderbook', { params }).then(response => response.data);
  },

  // Get order details
  getOrderDetails: async (orderId: string): Promise<OrderDetails> => {
    const response = await api.get(`/orderbook/${orderId}`);
    return response.data.data;
  },

  // Get project graph data
  getProjectGraph: async (projectId: string): Promise<ProjectGraphResponse> => {
    const response = await api.get(`/projects/${projectId}/graph`);
    
    if (response.data && (response.data.data || Array.isArray(response.data))) {
      return Array.isArray(response.data) 
        ? { 
          data: { 
            project_id: projectId,
            orders: response.data.map(item => item as any) || [],
            funding_rounds: [],
            price_history: []
          }, 
          project_name: '', 
          symbol: '' 
        }
        : response.data;
    } else {
      return {
        data: {
          project_id: projectId,
          orders: [],
          funding_rounds: [],
          price_history: []
        },
        project_name: '',
        symbol: ''
      };
    }
  },

  // Get attestation status
  getAttestationStatus: async (): Promise<AttestationStatus> => {
    try {
      const response = await api.get('/attestations/status');
      
      // API returns an object with a data field containing the attestation status
      const data = response.data.data;
      return {
        is_attested: data.has_attestation,
        has_attestation: data.has_attestation,
        is_accredited: data.is_accredited,
        latest_attestation_year: data.latest_attestation_year,
        attestation_date: undefined, // API does not return a date
        data: [] // API does not return an array of attestations
      };
    } catch {
      // Return a default response for testing
      return {
        is_attested: false,
        has_attestation: false,
        is_accredited: false,
        latest_attestation_year: null,
        attestation_date: undefined,
        data: []
      };
    }
  },

  // Get attestations list
  getAttestations: async (): Promise<Attestation[]> => {
    try {
      const response = await api.get('/attestations');
      
      // API returns an array of attestations in the data field
      return response.data.data || [];
    } catch {
      // Return a default response for testing
      return [];
    }
  },

  // Get attestation by ID
  getAttestationById: async (attestationId: string): Promise<Attestation | null> => {
    try {
      const response = await api.get(`/attestations/${attestationId}`);
      
      // API returns the attestation in the data field
      return response.data.data || null;
    } catch {
      return null;
    }
  },

  // Submit attestation
  submitAttestation: async (data: AttestationRequest): Promise<AttestationResponse> => {
    try {
      const response = await api.post('/attestations', data);
      
      // API returns an object with a data field containing the created attestation
      return {
        success: true,
        message: "Attestation submitted successfully",
        attestation_id: response.data.data?.attestation_id,
        data: response.data.data
      };
    } catch (error) {
      // Return a default response for testing
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to submit attestation"
      };
    }
  },

  // Delete attestation
  deleteAttestation: async (attestationId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await api.delete(`/attestations/${attestationId}`);
      return { success: true };
    } catch (error) {
      
      // If API returned an error with a message
      if (error && typeof error === 'object' && 'response' in error) {
        const responseData = (error as { response?: { data?: { error?: string } } }).response?.data;
        if (responseData && responseData.error) {
          return { success: false, error: responseData.error };
        }
      }
      
      return { success: false, error: "Failed to delete attestation" };
    }
  },

  // Portfolio API methods
  
  // Get all portfolios
  getPortfolios: async (): Promise<Portfolio[]> => {
    const response = await api.get('/portfolio');
    return response.data.data || [];
  },

  // Get portfolio by ID
  getPortfolioById: async (portfolioId: string): Promise<Portfolio> => {
    const response = await api.get(`/portfolio/${portfolioId}`);
    return response.data.data;
  },

  // Create portfolio
  createPortfolio: async (data: CreatePortfolioRequest): Promise<Portfolio> => {
    const response = await api.post('/portfolio', data);
    return response.data.data;
  },

  // Update portfolio
  updatePortfolio: async (portfolioId: string, data: UpdatePortfolioRequest): Promise<Portfolio> => {
    const response = await api.put(`/portfolio/${portfolioId}`, data);
    return response.data.data;
  },

  // Delete portfolio
  deletePortfolio: async (portfolioId: string): Promise<void> => {
    await api.delete(`/portfolio/${portfolioId}`);
  },

  // Get portfolio assets
  getPortfolioAssets: async (portfolioId: string): Promise<PortfolioAsset[]> => {
    const response = await api.get(`/portfolio/${portfolioId}`);
    
    // Return assets array from API response
    const assets = response.data.data.assets || [];
    
    // Transform data to the correct format
    return assets.map((asset: Partial<PortfolioAsset> & { 
      project?: { 
        project_id: string | null; 
        name: string; 
        logo: string | null; 
      } 
    }) => ({
      asset_id: asset.asset_id || '',
      portfolio_id: asset.portfolio_id || '',
      logo: asset.project?.logo || '',
      project_name: asset.project?.name || '',
      project: asset.project,
      project_website: asset.project_website || '',
      invested_amount: asset.invested_amount,
      valuation: asset.valuation,
      terms: asset.terms || '',
      date: asset.date || asset.created_at || '',
      created_at: asset.created_at || '',
      updated_at: asset.updated_at || '',
      equity_or_tokens_amount: asset.equity_or_tokens_amount
    }));
  },

  // Get portfolio asset by ID
  getPortfolioAssetById: async (_portfolioId: string, assetId: string): Promise<PortfolioAsset> => {
    const response = await api.get(`/portfolio/assets/${assetId}`);
    return response.data.data;
  },

  // Create portfolio asset
  createPortfolioAsset: async (portfolioId: string, data: CreatePortfolioAssetRequest): Promise<PortfolioAsset> => {
    // Transform data to the correct format
    const formattedData = {
      project_id: data.project_id || null,
      project_name: data.project_name,
      // Send date without timezone as required by API
      date: data.date.split('T')[0], // Format YYYY-MM-DD
      invested_amount: data.invested_amount,
      terms: data.terms || '',
      project_website: data.project_website || null,
      valuation: data.valuation ? data.valuation : null,
      equity_or_tokens_amount: data.equity_or_tokens_amount ? data.equity_or_tokens_amount : null
    };
    
    const response = await api.post(`/portfolio/${portfolioId}/assets`, formattedData);
    return response.data.data;
  },

  // Update portfolio asset
  updatePortfolioAsset: async (_portfolioId: string, assetId: string, data: UpdatePortfolioAssetRequest): Promise<PortfolioAsset> => {
    // Transform data to the correct format
    const formattedData = {
      project_id: data.project_id || null,
      project_name: data.project_name,
      // Send date without timezone as required by API
      date: data.date ? data.date.split('T')[0] : undefined, // Format YYYY-MM-DD
      invested_amount: data.invested_amount,
      terms: data.terms || '',
      project_website: data.project_website || null,
      valuation: data.valuation ?? 0,
      equity_or_tokens_amount: data.equity_or_tokens_amount
    };
    
    const response = await api.put(`/portfolio/assets/${assetId}`, formattedData);
    return response.data.data;
  },

  // Delete portfolio asset
  deletePortfolioAsset: async (_portfolioId: string, assetId: string): Promise<void> => {
    await api.delete(`/portfolio/assets/${assetId}`);
  },

  // Upload portfolio assets CSV
  uploadPortfolioAssetsCSV: async (_portfolioId: string, file: File): Promise<void> => {
    // Check file
    if (!file || file.size === 0) {
      throw new Error('CSV file is required and cannot be empty');
    }
    
    // Check file extension
    if (!file.name.endsWith('.csv')) {
      throw new Error('File must be in CSV format');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    await api.post('/portfolio/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // Create new portfolio from CSV
  createPortfolioFromCSV: async (name: string, file: File): Promise<CSVPortfolioResponse> => {
    // Check file
    if (!file || file.size === 0) {
      throw new Error('CSV file is required and cannot be empty');
    }
    
    // Check only file extension
    if (!file.name.endsWith('.csv')) {
      throw new Error('File must be in CSV format');
    }
    
    // Create FormData
    const formData = new FormData();
    formData.append('csv_file', file, file.name);
    formData.append('portfolio_name', name);
    
    // Send request
    const response = await api.post('/portfolio/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data.data;
  },

  // Add assets to existing portfolio from CSV
  addAssetsToPortfolioFromCSV: async (portfolioId: string, file: File, portfolioName?: string): Promise<CSVPortfolioResponse> => {
    // Check file
    if (!file || file.size === 0) {
      throw new Error('CSV file is required and cannot be empty');
    }
    
    // Check only file extension
    if (!file.name.endsWith('.csv')) {
      throw new Error('File must be in CSV format');
    }
    
    // If portfolio name is not passed, get it by ID
    let name = portfolioName;
    if (!name) {
      const portfolio = await apiService.getPortfolioById(portfolioId);
      name = portfolio.name;
    }
    
    if (!name) {
      throw new Error('Portfolio name is required');
    }
    
    // Create FormData with needed fields
    const formData = new FormData();
    formData.append('csv_file', file, file.name);
    formData.append('portfolio_name', name);
    formData.append('portfolio_id', portfolioId); // Add portfolio ID
    formData.append('append', 'true'); // Explicitly specify that we need to append, not replace
    
    // Use api instance for all requests
    const response = await api.post(`/portfolio/${portfolioId}/csv`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data.data;
  },

  // Get CSV template URL
  getCSVTemplateURL: (): string => {
    return 'https://d1yccqs7b7eo8o.cloudfront.net/28cb6313-ab56-4caf-a282-8aa8e1e2bb38';
  },

  // Search projects for portfolio assets
  searchProjects: async (query: string): Promise<ProjectSearchResult[]> => {
    const response = await api.get<ProjectSearchResponse>('/projects/ids', { 
      params: { 
        search: query,
        include_logo: true 
      } 
    });
    return response.data.data || [];
  },

  // Add assets from CSV one by one to existing portfolio (fallback method)
  addAssetsFromCSVOneByOne: async (portfolioId: string, file: File): Promise<void> => {
    // Check file
    if (!file || file.size === 0) {
      throw new Error('CSV file is required and cannot be empty');
    }
    
    // Check file extension
    if (!file.name.endsWith('.csv')) {
      throw new Error('CSV file format is required');
    }
    
    // Read CSV file as text
    const reader = new FileReader();
    
    const csvText = await new Promise<string>((resolve, reject) => {
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          resolve(e.target.result);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
    
    // Parse CSV
    const rows = csvText.split('\n');
    const headers = rows[0].split(',').map(h => h.trim().replace(/^"(.*)"$/, '$1'));
    
    // Check for required headers
    const requiredHeaders = ['project_name', 'date', 'invested_amount'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`CSV file is missing required headers: ${missingHeaders.join(', ')}`);
    }
    
    // Track success and error counts
    let successCount = 0;
    let errorCount = 0;
    
    // Process each row, starting from the second one (index 1)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].trim();
      if (!row) continue; // Skip empty rows
      
      const values = row.split(',').map(v => v.trim().replace(/^"(.*)"$/, '$1'));
      
      // Check if we have enough values
      if (values.length < headers.length) {
        errorCount++;
        continue;
      }
      
      // Create object with asset data
      const assetData: Record<string, string | null> = {};
      headers.forEach((header, index) => {
        assetData[header] = values[index] || null;
      });
      
      try {
        // Transform data to format expected by API
        const formattedData = {
          project_name: assetData.project_name,
          date: assetData.date, // Format YYYY-MM-DD
          invested_amount: assetData.invested_amount,
          terms: assetData.terms || '',
          project_website: assetData.project_website || null,
          valuation: assetData.valuation || null,
          equity_or_tokens_amount: assetData.equity_or_tokens_amount || null
        };
        
        // Create asset using standard API
        await api.post(`/portfolio/${portfolioId}/assets`, formattedData);
        successCount++;
      } catch {
        errorCount++;
      }
    }
    
    // If no assets were added successfully, throw an error
    if (successCount === 0) {
      throw new Error(`Failed to add any assets. Errors: ${errorCount}`);
    }
    
    // If there were errors but some assets were added successfully
    if (errorCount > 0) {
      console.warn(`Some assets (${errorCount}) failed to import. Successfully imported: ${successCount}`);
    }
  },

  // Notification methods
  
  // Get notification settings
  getNotificationSettings: async (): Promise<NotificationSettings> => {
    const response = await api.get('/notifications/settings');
    return response.data.data;
  },

  // Update notification settings
  updateNotificationSettings: async (settings: {
    telegram_notifications: boolean;
    email_notifications: boolean;
    email?: string;
  }): Promise<NotificationSettings> => {
    const response = await api.put('/notifications/settings', settings);
    return response.data.data;
  },

  // Get notification event types
  getNotificationEventTypes: async (params?: { active_only?: boolean }): Promise<NotificationEventType[]> => {
    const response = await api.get('/notifications/event-types', { params });
    return response.data.data;
  },

  // Get notification preferences
  getNotificationPreferences: async (): Promise<NotificationPreference[]> => {
    const response = await api.get('/notifications/preferences');
    return response.data.data;
  },

  // Update notification preference for specific event type
  updateNotificationPreference: async (preferenceData: {
    event_type_id: string;
    telegram_enabled: boolean;
    email_enabled: boolean;
  }): Promise<NotificationPreference> => {
    const response = await api.put('/notifications/preferences', preferenceData);
    return response.data.data;
  },

  // Get user notifications
  getNotifications: async (params?: { unread_only?: boolean; limit?: number; offset?: number }): Promise<Notification[]> => {
    const response = await api.get('/notifications', { params });
    return response.data.data;
  },

  // Mark notification as read
  markNotificationAsRead: async (notificationId: string): Promise<void> => {
    await api.post(`/notifications/${notificationId}/read`);
  },

  // Get unread notifications count
  getUnreadNotificationsCount: async (): Promise<number> => {
    const response = await api.get('/notifications/unread-count');
    return response.data.data.count;
  },

  // Get portfolio summary
  getPortfolioSummary: async (): Promise<PortfolioSummary> => {
    const response = await api.get('/portfolio/summary');
    
    // Transform API response to match our interface
    const responseData = response.data.data;
    
    return {
      total_invested_amount: responseData.total_invested_amount,
      total_current_value: responseData.total_current_value,
      total_gain_loss_usd: responseData.total_gain_loss_usd,
      total_gain_loss_percentage: responseData.total_gain_loss_percentage,
      total_assets: responseData.total_assets,
      assets: responseData.assets || []
    };
  },

  // Get portfolio summary for specific portfolio
  getPortfolioSummaryById: async (portfolioId: string): Promise<PortfolioSummary> => {
    const response = await api.get(`/portfolio/${portfolioId}/summary`);
    
    // Transform API response to match our interface
    const responseData = response.data.data;
    
    return {
      total_invested_amount: responseData.total_invested_amount,
      total_current_value: responseData.total_current_value,
      total_gain_loss_usd: responseData.total_gain_loss_usd,
      total_gain_loss_percentage: responseData.total_gain_loss_percentage,
      total_assets: responseData.total_assets,
      assets: responseData.assets || []
    };
  },

  // Get portfolio graph data
  getPortfolioGraph: async (): Promise<PortfolioGraphResponse> => {
    const response = await api.get('/portfolio/summary/graph');
    return response.data;
  },

  // Get portfolio graph data for specific portfolio
  getPortfolioGraphById: async (portfolioId: string): Promise<PortfolioGraphResponse> => {
    const response = await api.get(`/portfolio/${portfolioId}/summary/graph`);
    return response.data;
  },

  // Get asset summary
  getAssetSummary: async (assetId: string): Promise<AssetSummary> => {
    const response = await api.get(`/portfolio/assets/${assetId}/summary`);
    return response.data.data;
  },

  // Get asset graph data
  getAssetGraph: async (assetId: string): Promise<AssetGraphResponse> => {
    const response = await api.get(`/portfolio/assets/${assetId}/summary/graph`);
    return response.data;
  },

  // Mark multiple notifications as read
  readNotificationsBatch: async (notificationIds: string[]): Promise<void> => {
    await api.post('/notifications/read-batch', { notification_ids: notificationIds });
  },

  // Get project unlocks
  getProjectUnlocks: async (projectId: string): Promise<ProjectUnlockResponse> => {
    const response = await api.get(`/projects/${projectId}/unlock`);
    return response.data;
  },

  // Get portfolio unlocks
  getPortfolioUnlocks: async (portfolioId: string): Promise<PortfolioUnlocksResponse['data']> => {
    const response = await api.get(`/portfolio/${portfolioId}/unlocks`);
    return response.data.data;
  },

  // Get all unlocks summary across portfolios
  getUnlocksSummary: async (): Promise<PortfolioUnlockSummaryResponse['data']> => {
    const response = await api.get('/portfolio/unlocks/summary');
    return response.data.data;
  },

  // Get all unlock allocations across portfolios
  getUnlocksAllocations: async (): Promise<PortfolioUnlockAllocationsResponse['data']> => {
    const response = await api.get('/portfolio/unlocks/allocations');
    return response.data.data;
  },
}; 